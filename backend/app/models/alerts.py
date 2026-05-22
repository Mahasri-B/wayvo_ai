"""
Alert models - road warnings, weather alerts, safety notices.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, Enum
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class AlertSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class AlertType(str, enum.Enum):
    landslide = "landslide"
    flood = "flood"
    fog = "fog"
    heavy_rain = "heavy_rain"
    road_closure = "road_closure"
    road_damage = "road_damage"
    bridge_closure = "bridge_closure"
    safety = "safety"
    general = "general"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(50), index=True)
    severity = Column(String(20), default="medium")
    title = Column(String(300))
    description = Column(Text)
    affected_area = Column(String(300), index=True)
    district = Column(String(100), index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    source = Column(String(100))            # "manual", "openweathermap", "news"
    is_active = Column(Boolean, default=True)
    valid_from = Column(DateTime(timezone=True))
    valid_until = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
