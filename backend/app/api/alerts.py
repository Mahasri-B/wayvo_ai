from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.alerts import Alert
from app.services.weather_service import get_weather_alerts, get_current_weather
from typing import Optional

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/")
async def get_alerts(district: Optional[str] = None, db: Session = Depends(get_db)):
    """Active alerts from DB + live weather alerts."""
    query = db.query(Alert).filter(Alert.is_active == True)
    if district:
        query = query.filter(Alert.district.ilike(f"%{district}%"))
    db_alerts = query.order_by(Alert.created_at.desc()).limit(20).all()

    weather_alerts = await get_weather_alerts(district)

    return {
        "db_alerts": [
            {"id": a.id, "type": a.alert_type, "severity": a.severity,
             "title": a.title, "description": a.description,
             "district": a.district, "latitude": a.latitude, "longitude": a.longitude}
            for a in db_alerts
        ],
        "weather_alerts": weather_alerts,
    }


@router.get("/weather/{district}")
async def district_weather(district: str):
    """Current weather for a specific TN district."""
    return await get_current_weather(district)


@router.post("/")
async def create_alert(alert_data: dict, db: Session = Depends(get_db)):
    """Manually create an alert."""
    alert = Alert(**alert_data)
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return {"id": alert.id, "message": "Alert created"}
