from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./pathfinder_tn.db"

    # OSRM (free, no key)
    osrm_base_url: str = "https://router.project-osrm.org"

    # Geocoding (free, no key)
    photon_base_url: str = "https://photon.komoot.io"
    nominatim_base_url: str = "https://nominatim.openstreetmap.org"

    # Elevation (free, no key)
    open_elevation_url: str = "https://api.open-elevation.com/api/v1/lookup"

    # Overpass (free, no key)
    overpass_url: str = "https://overpass-api.de/api/interpreter"

    # Weather
    weatherapi_key: Optional[str] = None
    open_meteo_url: str = "https://api.open-meteo.com/v1/forecast"

    # LLM
    groq_api_key: Optional[str] = None
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "llama3"

    # ChromaDB
    chroma_host: str = "localhost"
    chroma_port: int = 8001

    environment: str = "development"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
