"""
Transport models - schemas for bus routes, train connections, local transport.
Actual data will be loaded via ingestion pipeline.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, JSON, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class BusRoute(Base):
    __tablename__ = "bus_routes"

    id = Column(Integer, primary_key=True, index=True)
    route_number = Column(String(50), index=True)
    operator = Column(String(100))          # TNSTC, SETC, private, etc.
    origin = Column(String(200), index=True)
    destination = Column(String(200), index=True)
    via_stops = Column(JSON)                # list of intermediate stops
    departure_times = Column(JSON)          # list of departure times
    frequency_minutes = Column(Integer)     # avg frequency, null if irregular
    duration_minutes = Column(Integer)
    fare_inr = Column(Float)
    bus_type = Column(String(50))           # ordinary, express, AC, mini
    operates_on = Column(JSON)              # ["Mon","Tue",...] or ["daily"]
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class TrainConnection(Base):
    __tablename__ = "train_connections"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String(20), index=True)
    train_name = Column(String(200))
    origin_station = Column(String(200), index=True)
    destination_station = Column(String(200), index=True)
    origin_code = Column(String(10))
    destination_code = Column(String(10))
    via_stations = Column(JSON)
    departure_time = Column(String(10))     # HH:MM format
    arrival_time = Column(String(10))
    duration_minutes = Column(Integer)
    fare_sleeper = Column(Float)
    fare_general = Column(Float)
    fare_ac = Column(Float)
    train_type = Column(String(50))         # express, passenger, superfast
    operates_on = Column(JSON)              # days of week
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LocalTransport(Base):
    __tablename__ = "local_transport"

    id = Column(Integer, primary_key=True, index=True)
    transport_type = Column(String(50), index=True)  # auto, share_auto, van, ferry, etc.
    area = Column(String(200), index=True)
    origin = Column(String(200))
    destination = Column(String(200))
    approximate_fare_inr = Column(Float)
    fare_type = Column(String(20))          # fixed, metered, negotiable
    availability = Column(String(100))      # "6am-10pm", "24hrs", etc.
    frequency = Column(String(100))
    capacity = Column(Integer)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TransportHub(Base):
    __tablename__ = "transport_hubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True)
    hub_type = Column(String(50))           # bus_stand, railway_station, ferry_point
    district = Column(String(100), index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(Text)
    facilities = Column(JSON)               # ["waiting_room","toilet","food"]
    operating_hours = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
