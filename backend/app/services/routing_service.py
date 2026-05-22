"""
Routing & Geocoding service using free APIs only:
  - OSRM  : route geometry + duration/distance
  - Photon: location autocomplete (primary)
  - Nominatim: geocoding fallback
  - Open-Elevation: elevation data for hill roads
  - Overpass: OSM transport hub discovery
"""
import httpx
from typing import Optional, Tuple, List, Dict
from app.config import settings

HEADERS_NOMINATIM = {"User-Agent": "WayvoAI/1.0 (wayvo-ai@example.com)"}
HEADERS_PHOTON = {"User-Agent": "WayvoAI/1.0"}

# Local coordinate cache for major TN cities — instant, no API call needed
_TN_COORDS: Dict[str, Tuple[float, float]] = {
    "chennai": (13.0827, 80.2707), "madurai": (9.9252, 78.1198),
    "coimbatore": (11.0168, 76.9558), "trichy": (10.7905, 78.7047),
    "tiruchirappalli": (10.7905, 78.7047), "salem": (11.6643, 78.1460),
    "tirunelveli": (8.7139, 77.7567), "vellore": (12.9165, 79.1325),
    "erode": (11.3410, 77.7172), "thanjavur": (10.7870, 79.1378),
    "ooty": (11.4102, 76.6950), "udhagamandalam": (11.4102, 76.6950),
    "kodaikanal": (10.2381, 77.4892), "yercaud": (11.7750, 78.2083),
    "coonoor": (11.3530, 76.7959), "kotagiri": (11.4333, 76.8667),
    "valparai": (10.3269, 76.9553), "kolli hills": (11.2833, 78.3167),
    "yelagiri": (12.5833, 78.6333), "meghamalai": (9.8833, 77.3167),
    "topslip": (10.4167, 76.9833), "rameswaram": (9.2876, 79.3129),
    "kanyakumari": (8.0883, 77.5385), "pondicherry": (11.9416, 79.8083),
    "puducherry": (11.9416, 79.8083), "dindigul": (10.3624, 77.9695),
    "pollachi": (10.6590, 77.0070), "palani": (10.4500, 77.5167),
    "mettupalayam": (11.2987, 76.9366), "namakkal": (11.2167, 78.1667),
    "karur": (10.9601, 78.0766), "theni": (10.0104, 77.4770),
    "tirupattur": (12.4967, 78.5731), "jolarpettai": (12.5667, 78.5833),
    "sathyamangalam": (11.5000, 77.2333), "nagercoil": (8.1833, 77.4333),
    "tiruvannamalai": (12.2253, 79.0747), "villupuram": (11.9401, 79.4861),
    "chengalpattu": (12.6921, 79.9764), "tambaram": (12.9249, 80.1000),
    "katpadi": (12.9701, 79.1447), "mahabalipuram": (12.6269, 80.1927),
}


# ── Geocoding ────────────────────────────────────────────────────────────────

async def geocode(place: str) -> Optional[Tuple[float, float]]:
    """
    Geocode a place name to (lat, lon).
    Checks local TN cache first, then Photon, then Nominatim.
    """
    # 1. Local cache — instant, no network
    key = place.strip().lower()
    if key in _TN_COORDS:
        return _TN_COORDS[key]
    # partial match
    for city, coords in _TN_COORDS.items():
        if key in city or city in key:
            return coords

    # 2. Photon → Nominatim fallback
    coords = await _photon_geocode(place)
    if coords:
        return coords
    return await _nominatim_geocode(place)


async def _photon_geocode(place: str) -> Optional[Tuple[float, float]]:
    """Photon (Komoot) geocoding — fast, OSM-based, no key needed."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"{settings.photon_base_url}/api/",
                params={"q": f"{place} Tamil Nadu India", "limit": 1},
                headers=HEADERS_PHOTON,
            )
            if resp.status_code == 200:
                features = resp.json().get("features", [])
                if features:
                    coords = features[0]["geometry"]["coordinates"]
                    return (coords[1], coords[0])  # (lat, lon)
    except Exception:
        pass
    return None


async def _nominatim_geocode(place: str) -> Optional[Tuple[float, float]]:
    """Nominatim geocoding fallback."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"{settings.nominatim_base_url}/search",
                params={
                    "q": f"{place}, Tamil Nadu, India",
                    "format": "json",
                    "limit": 1,
                    "countrycodes": "in",
                },
                headers=HEADERS_NOMINATIM,
            )
            if resp.status_code == 200:
                results = resp.json()
                if results:
                    return (float(results[0]["lat"]), float(results[0]["lon"]))
    except Exception:
        pass
    return None


async def search_locations(query: str, limit: int = 5) -> List[Dict]:
    """Autocomplete location search using Photon."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"{settings.photon_base_url}/api/",
                params={"q": f"{query} Tamil Nadu", "limit": limit},
                headers=HEADERS_PHOTON,
            )
            if resp.status_code == 200:
                features = resp.json().get("features", [])
                results = []
                for f in features:
                    props = f.get("properties", {})
                    coords = f["geometry"]["coordinates"]
                    name = props.get("name") or props.get("city") or props.get("county") or query
                    state = props.get("state", "")
                    results.append({
                        "name": name,
                        "display": f"{name}{', ' + state if state else ''}",
                        "lat": coords[1],
                        "lon": coords[0],
                        "type": props.get("type", ""),
                    })
                return results
    except Exception:
        pass
    return []


# ── OSRM Routing ─────────────────────────────────────────────────────────────

async def get_route_geometry(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
    profile: str = "driving",
) -> Optional[Dict]:
    """
    Get route geometry from OSRM.
    profile: driving | walking | cycling
    Returns GeoJSON geometry + distance_km + duration_minutes.
    """
    # OSRM expects lon,lat order
    coords = f"{origin[1]},{origin[0]};{destination[1]},{destination[0]}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{settings.osrm_base_url}/route/v1/{profile}/{coords}",
                params={
                    "overview": "full",
                    "geometries": "geojson",
                    "steps": "false",
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]
                    return {
                        "geometry": route["geometry"],
                        "distance_km": round(route["distance"] / 1000, 2),
                        "duration_minutes": round(route["duration"] / 60, 1),
                    }
    except Exception:
        pass
    return None


async def get_multileg_geometry(legs: List[Dict]) -> List[Dict]:
    """Get OSRM geometry for each leg of a multimodal route."""
    results = []
    for leg in legs:
        origin = await geocode(leg.get("from_stop", ""))
        dest = await geocode(leg.get("to_stop", ""))
        if not origin or not dest:
            continue
        profile = _mode_to_osrm_profile(leg.get("mode", "driving"))
        geom = await get_route_geometry(origin, dest, profile)
        if geom:
            results.append({
                "leg_mode": leg.get("mode"),
                "from": leg.get("from_stop"),
                "to": leg.get("to_stop"),
                "geometry": geom["geometry"],
                "distance_km": geom["distance_km"],
                "duration_minutes": geom["duration_minutes"],
            })
    return results


def _mode_to_osrm_profile(mode: str) -> str:
    mapping = {
        "walk": "foot",
        "walking": "foot",
        "cycle": "cycling",
        "cycling": "cycling",
        "bus": "driving",
        "train": "driving",
        "auto": "driving",
        "car": "driving",
    }
    return mapping.get(mode.lower(), "driving")


# ── Elevation ────────────────────────────────────────────────────────────────

async def get_elevation(lat: float, lon: float) -> Optional[float]:
    """Get elevation in metres for a coordinate."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                settings.open_elevation_url,
                params={"locations": f"{lat},{lon}"},
            )
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                if results:
                    return results[0].get("elevation")
    except Exception:
        pass
    return None


async def get_route_elevation_profile(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
) -> Dict:
    """Get elevation at origin and destination to flag hill routes."""
    origin_elev = await get_elevation(*origin)
    dest_elev = await get_elevation(*destination)
    gain = None
    if origin_elev is not None and dest_elev is not None:
        gain = round(dest_elev - origin_elev, 1)
    return {
        "origin_elevation_m": origin_elev,
        "destination_elevation_m": dest_elev,
        "elevation_gain_m": gain,
        "is_hill_route": dest_elev is not None and dest_elev > 800,
    }


# ── Overpass (OSM transport hubs) ────────────────────────────────────────────

async def get_nearby_bus_stops(lat: float, lon: float, radius_m: int = 2000) -> List[Dict]:
    """Fetch bus stops near a coordinate from OSM via Overpass."""
    query = f"""
    [out:json][timeout:10];
    node["highway"="bus_stop"](around:{radius_m},{lat},{lon});
    out body;
    """
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(settings.overpass_url, data={"data": query})
            if resp.status_code == 200:
                elements = resp.json().get("elements", [])
                return [
                    {
                        "name": e.get("tags", {}).get("name", "Bus Stop"),
                        "lat": e["lat"],
                        "lon": e["lon"],
                        "type": "bus_stop",
                    }
                    for e in elements[:10]
                ]
    except Exception:
        pass
    return []


async def get_nearby_train_stations(lat: float, lon: float, radius_m: int = 10000) -> List[Dict]:
    """Fetch railway stations near a coordinate from OSM via Overpass."""
    query = f"""
    [out:json][timeout:10];
    node["railway"="station"](around:{radius_m},{lat},{lon});
    out body;
    """
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(settings.overpass_url, data={"data": query})
            if resp.status_code == 200:
                elements = resp.json().get("elements", [])
                return [
                    {
                        "name": e.get("tags", {}).get("name", "Railway Station"),
                        "lat": e["lat"],
                        "lon": e["lon"],
                        "type": "railway_station",
                    }
                    for e in elements[:5]
                ]
    except Exception:
        pass
    return []
