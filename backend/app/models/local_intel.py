"""
Local intelligence models - village info, road conditions, scenic notes, safety tips.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, JSON, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True)
    local_name = Column(String(200))        # Tamil name
    location_type = Column(String(50))      # village, town, hill_station, city
    district = Column(String(100), index=True)
    taluk = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    population = Column(Integer)
    elevation_m = Column(Float)
    nearest_town = Column(String(200))
    nearest_railway = Column(String(200))
    nearest_bus_stand = Column(String(200))
    connectivity_notes = Column(Text)
    best_season = Column(String(200))
    avoid_season = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(Integer, primary_key=True, index=True)
    from_location = Column(String(200), index=True)
    to_location = Column(String(200), index=True)
    road_name = Column(String(200))
    road_type = Column(String(50))          # NH, SH, MDR, village_road, ghat
    distance_km = Column(Float)
    condition = Column(String(50))          # good, fair, poor, seasonal
    is_ghat_road = Column(Boolean, default=False)
    ghat_sections = Column(Integer)         # number of hairpin bends
    is_seasonal = Column(Boolean, default=False)
    closed_months = Column(JSON)            # months when road is closed
    scenic_rating = Column(Integer)         # 1-5
    difficulty_rating = Column(Integer)     # 1-5
    safety_notes = Column(Text)
    local_tips = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LocalIntelligence(Base):
    __tablename__ = "local_intelligence"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String(200), index=True)
    district = Column(String(100), index=True)
    category = Column(String(100))          # accommodation, food, safety, transport_tip
    title = Column(String(300))
    content = Column(Text)
    tags = Column(JSON)
    is_verified = Column(Boolean, default=False)
    source = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
