import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.route import RouteRequest, RouteResponse
from app.services.route_service import find_routes
from app.services.weather_service import get_weather_alerts
from app.services.routing_service import (
    geocode, get_multileg_geometry, get_route_elevation_profile,
    search_locations, get_nearby_bus_stops, get_nearby_train_stations,
)
from app.rag.retriever import retrieve_local_intelligence, retrieve_route_notes
from app.rag.llm_service import generate_route_explanation
from app.models.alerts import Alert

router = APIRouter(prefix="/routes", tags=["routes"])


async def _safe_weather(district=None):
    """Fetch weather with a hard 8s timeout — never blocks route search."""
    try:
        return await asyncio.wait_for(get_weather_alerts(district), timeout=8.0)
    except Exception:
        return []


@router.post("/search", response_model=RouteResponse)
async def search_routes(request: RouteRequest, db: Session = Depends(get_db)):
    """
    Route search: geocode → elevation → DB routes → alerts → RAG → LLM summary.
    Geometry is fetched separately by the frontend via /routes/geometry.
    """
    # 1. Geocode both ends (fast — Nominatim/Photon)
    origin_coords, dest_coords = await asyncio.gather(
        geocode(request.from_location),
        geocode(request.to_location),
    )

    # 2. Elevation profile (non-blocking, short timeout)
    elevation = {}
    if origin_coords and dest_coords:
        try:
            elevation = await asyncio.wait_for(
                get_route_elevation_profile(origin_coords, dest_coords),
                timeout=6.0,
            )
        except Exception:
            elevation = {}

    # 3. Find routes from DB (instant — SQLite query)
    routes = find_routes(
        db,
        from_location=request.from_location,
        to_location=request.to_location,
        mode=request.mode.value,
        preference=request.preference.value,
        elevation_info=elevation,
    )

    # 4. Alerts — DB (instant) + weather (capped at 8s)
    db_alerts = db.query(Alert).filter(Alert.is_active == True).limit(10).all()
    weather_alerts = await _safe_weather()
    all_alerts = [
        {"type": a.alert_type, "severity": a.severity, "title": a.title,
         "description": a.description, "district": a.district,
         "latitude": a.latitude, "longitude": a.longitude}
        for a in db_alerts
    ] + weather_alerts

    # 5. RAG retrieval (no-op if ChromaDB not installed)
    local_intel = retrieve_route_notes(request.from_location, request.to_location)
    local_intel += retrieve_local_intelligence(
        f"travel from {request.from_location} to {request.to_location}"
    )

    # 6. LLM summary — run with a strict 18s cap so total response stays under 30s
    routes_dicts = [r.model_dump() for r in routes]
    try:
        ai_summary = await asyncio.wait_for(
            generate_route_explanation(
                from_loc=request.from_location,
                to_loc=request.to_location,
                routes=routes_dicts,
                local_intel=local_intel,
                alerts=all_alerts,
                preference=request.preference.value,
                elevation=elevation,
            ),
            timeout=18.0,
        )
    except asyncio.TimeoutError:
        ai_summary = "AI summary timed out — routes are shown above."

    return RouteResponse(
        from_location=request.from_location,
        to_location=request.to_location,
        routes=routes,
        active_alerts=all_alerts[:5],
        ai_summary=ai_summary,
    )


@router.get("/geometry")
async def get_route_geometry(from_loc: str, to_loc: str):
    """OSRM route geometry for Leaflet map — called separately by frontend."""
    origin, dest = await asyncio.gather(geocode(from_loc), geocode(to_loc))

    if not origin or not dest:
        raise HTTPException(status_code=404, detail="Could not geocode one or both locations")

    # Run OSRM + elevation in parallel
    legs = [{"mode": "driving", "from_stop": from_loc, "to_stop": to_loc}]
    geometries, elevation = await asyncio.gather(
        get_multileg_geometry(legs),
        get_route_elevation_profile(origin, dest),
    )

    return {
        "origin":      {"lat": origin[0], "lon": origin[1], "name": from_loc},
        "destination": {"lat": dest[0],   "lon": dest[1],   "name": to_loc},
        "geometries":  geometries,
        "elevation":   elevation,
    }


@router.get("/locations/search")
async def location_search(q: str, limit: int = 5):
    """Photon-powered location autocomplete."""
    results = await search_locations(q, limit=limit)
    if not results:
        coords = await geocode(q)
        if coords:
            return [{"name": q, "lat": coords[0], "lon": coords[1], "display": q}]
        raise HTTPException(status_code=404, detail="Location not found")
    return results


@router.get("/nearby/bus-stops")
async def nearby_bus_stops(lat: float, lon: float, radius: int = 2000):
    return await get_nearby_bus_stops(lat, lon, radius)


@router.get("/nearby/train-stations")
async def nearby_train_stations(lat: float, lon: float, radius: int = 10000):
    return await get_nearby_train_stations(lat, lon, radius)


@router.get("/elevation")
async def elevation_lookup(lat: float, lon: float):
    from app.services.routing_service import get_elevation
    elev = await get_elevation(lat, lon)
    return {"lat": lat, "lon": lon, "elevation_m": elev}
