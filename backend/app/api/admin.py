"""
Admin endpoints for dataset status and health checks.
Actual ingestion is done via the ingest.py script.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.transport import BusRoute, TrainConnection, LocalTransport, TransportHub
from app.models.local_intel import Location, RoadSegment, LocalIntelligence
from app.models.alerts import Alert

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get dataset statistics."""
    return {
        "bus_routes": db.query(BusRoute).count(),
        "train_connections": db.query(TrainConnection).count(),
        "local_transport": db.query(LocalTransport).count(),
        "transport_hubs": db.query(TransportHub).count(),
        "locations": db.query(Location).count(),
        "road_segments": db.query(RoadSegment).count(),
        "local_intelligence": db.query(LocalIntelligence).count(),
        "active_alerts": db.query(Alert).filter(Alert.is_active == True).count(),
    }


@router.get("/hill-stations")
async def get_hill_stations(db: Session = Depends(get_db)):
    """Return all hill station locations with their intel."""
    hills = db.query(Location).filter(Location.location_type == "hill_station").all()
    result = []
    for h in hills:
        intel = db.query(LocalIntelligence).filter(
            LocalIntelligence.location == h.name,
            LocalIntelligence.category == "hill_station"
        ).first()
        road = db.query(RoadSegment).filter(
            RoadSegment.to_location == h.name
        ).first()
        result.append({
            "name": h.name,
            "district": h.district,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "elevation_m": h.elevation_m,
            "nearest_town": h.nearest_town,
            "nearest_railway": h.nearest_railway,
            "nearest_bus_stand": h.nearest_bus_stand,
            "best_season": h.best_season,
            "avoid_season": h.avoid_season,
            "connectivity_notes": h.connectivity_notes,
            "intel": intel.content if intel else None,
            "warnings": road.safety_notes.split("; ") if road and road.safety_notes else [],
        })
    return result


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "Wayvo AI Backend"}
