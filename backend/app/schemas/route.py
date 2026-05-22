from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class TransportMode(str, Enum):
    any = "any"
    train = "train"
    bus = "bus"
    car = "car"
    local = "local"


class RoutePreference(str, Enum):
    cheapest = "cheapest"
    fastest = "fastest"
    scenic = "scenic"
    safest = "safest"


class RouteRequest(BaseModel):
    from_location: str
    to_location: str
    mode: TransportMode = TransportMode.any
    preference: RoutePreference = RoutePreference.fastest
    date: Optional[str] = None  # YYYY-MM-DD


class TransportLeg(BaseModel):
    mode: str                   # bus, train, auto, walk, etc.
    from_stop: str
    to_stop: str
    operator: Optional[str] = None
    route_number: Optional[str] = None
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    duration_minutes: int
    fare_inr: float
    notes: Optional[str] = None


class RouteOption(BaseModel):
    route_id: str
    label: str                  # e.g. "Via Chennai Central"
    legs: List[TransportLeg]
    total_duration_minutes: int
    total_fare_inr: float
    difficulty_rating: int      # 1-5
    scenic_rating: int          # 1-5
    safety_rating: int          # 1-5
    warnings: List[str]
    highlights: List[str]
    route_type: str             # direct, 1-change, 2-change, etc.


class RouteResponse(BaseModel):
    from_location: str
    to_location: str
    routes: List[RouteOption]
    active_alerts: List[dict]
    ai_summary: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None   # current route context if any
    history: Optional[List[dict]] = None


class ChatResponse(BaseModel):
    reply: str
    suggested_routes: Optional[List[str]] = None
    alerts: Optional[List[str]] = None
