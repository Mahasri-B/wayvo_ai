"""
Weather service using WeatherAPI.com (primary) + Open-Meteo (free fallback).
"""
import httpx
from typing import List, Dict, Optional
from app.config import settings

# Key Tamil Nadu districts with coordinates
TN_DISTRICTS = {
    "Chennai":      (13.0827, 80.2707),
    "Coimbatore":   (11.0168, 76.9558),
    "Madurai":      (9.9252,  78.1198),
    "Trichy":       (10.7905, 78.7047),
    "Salem":        (11.6643, 78.1460),
    "Ooty":         (11.4102, 76.6950),
    "Kodaikanal":   (10.2381, 77.4892),
    "Yercaud":      (11.7750, 78.2083),
    "Kanyakumari":  (8.0883,  77.5385),
    "Rameswaram":   (9.2876,  79.3129),
    "Vellore":      (12.9165, 79.1325),
    "Tirunelveli":  (8.7139,  77.7567),
    "Thanjavur":    (10.7870, 79.1378),
    "Dindigul":     (10.3624, 77.9695),
    "Erode":        (11.3410, 77.7172),
    "Nilgiris":     (11.4916, 76.7337),
    "Theni":        (10.0104, 77.4770),
    "Virudhunagar": (9.5810,  77.9624),
}


async def get_weather_alerts(district: Optional[str] = None) -> List[Dict]:
    """
    Fetch weather for TN districts and generate travel alerts.
    Uses WeatherAPI.com if key is set, else Open-Meteo (free).
    """
    districts = (
        {district: TN_DISTRICTS[district]}
        if district and district in TN_DISTRICTS
        else TN_DISTRICTS
    )

    alerts = []
    for name, (lat, lon) in districts.items():
        if settings.weatherapi_key:
            alert = await _weatherapi_alert(name, lat, lon)
        else:
            alert = await _openmeteo_alert(name, lat, lon)
        if alert:
            alerts.append(alert)

    return alerts


async def get_current_weather(district: str) -> Dict:
    """Get full current weather for a district."""
    coords = TN_DISTRICTS.get(district)
    if not coords:
        return {"error": f"District '{district}' not in known list"}
    lat, lon = coords

    if settings.weatherapi_key:
        return await _weatherapi_current(district, lat, lon)
    return await _openmeteo_current(district, lat, lon)


# ── WeatherAPI.com ────────────────────────────────────────────────────────────

async def _weatherapi_alert(district: str, lat: float, lon: float) -> Optional[Dict]:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://api.weatherapi.com/v1/current.json",
                params={"key": settings.weatherapi_key, "q": f"{lat},{lon}", "aqi": "no"},
            )
            if resp.status_code == 200:
                return _parse_weatherapi(district, resp.json())
    except Exception:
        pass
    return None


async def _weatherapi_current(district: str, lat: float, lon: float) -> Dict:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://api.weatherapi.com/v1/current.json",
                params={"key": settings.weatherapi_key, "q": f"{lat},{lon}", "aqi": "no"},
            )
            if resp.status_code == 200:
                d = resp.json()
                c = d.get("current", {})
                return {
                    "district": district,
                    "temp_c": c.get("temp_c"),
                    "condition": c.get("condition", {}).get("text"),
                    "wind_kph": c.get("wind_kph"),
                    "humidity": c.get("humidity"),
                    "precip_mm": c.get("precip_mm"),
                    "visibility_km": c.get("vis_km"),
                    "source": "weatherapi",
                }
    except Exception:
        pass
    return {"error": "Failed to fetch weather"}


def _parse_weatherapi(district: str, data: dict) -> Optional[Dict]:
    c = data.get("current", {})
    condition_text = c.get("condition", {}).get("text", "").lower()
    precip = c.get("precip_mm", 0) or 0
    wind = c.get("wind_kph", 0) or 0
    vis = c.get("vis_km", 10) or 10
    temp = c.get("temp_c")

    if precip > 20 or "heavy rain" in condition_text or "torrential" in condition_text:
        return {
            "type": "heavy_rain", "severity": "high", "district": district,
            "title": f"Heavy Rain Alert — {district}",
            "description": f"{c.get('condition',{}).get('text','')}. Ghat roads may be dangerous. Precip: {precip}mm.",
            "temperature": temp, "wind_kph": wind, "source": "weatherapi",
        }
    if vis < 1 or "fog" in condition_text or "mist" in condition_text:
        return {
            "type": "fog", "severity": "medium", "district": district,
            "title": f"Low Visibility — {district}",
            "description": f"Visibility {vis}km. Drive carefully on hill roads.",
            "temperature": temp, "source": "weatherapi",
        }
    if precip > 5 or "rain" in condition_text or "drizzle" in condition_text:
        return {
            "type": "rain", "severity": "low", "district": district,
            "title": f"Rain — {district}",
            "description": f"{c.get('condition',{}).get('text','')}. Check road conditions.",
            "temperature": temp, "source": "weatherapi",
        }
    if wind > 50:
        return {
            "type": "strong_wind", "severity": "medium", "district": district,
            "title": f"Strong Wind — {district}",
            "description": f"Wind speed {wind} kph. Caution on exposed hill roads.",
            "temperature": temp, "source": "weatherapi",
        }
    return None


# ── Open-Meteo (free fallback, no key) ───────────────────────────────────────

# WMO weather code → (type, severity, description)
_WMO = {
    range(51, 68):  ("rain",       "low",    "Light to moderate rain"),
    range(71, 78):  ("snow",       "medium", "Snowfall — hill roads may be blocked"),
    range(80, 83):  ("heavy_rain", "high",   "Heavy rain showers — ghat roads dangerous"),
    range(95, 100): ("storm",      "high",   "Thunderstorm — avoid travel"),
    range(45, 49):  ("fog",        "medium", "Fog — low visibility on hill roads"),
}


async def _openmeteo_alert(district: str, lat: float, lon: float) -> Optional[Dict]:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                settings.open_meteo_url,
                params={
                    "latitude": lat, "longitude": lon,
                    "current_weather": "true",
                    "hourly": "precipitation,visibility",
                    "forecast_days": 1,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                cw = data.get("current_weather", {})
                wmo = cw.get("weathercode", 0)
                for code_range, (atype, severity, desc) in _WMO.items():
                    if wmo in code_range:
                        return {
                            "type": atype, "severity": severity, "district": district,
                            "title": f"{desc.split('—')[0].strip()} — {district}",
                            "description": desc,
                            "temperature": cw.get("temperature"),
                            "wind_kph": round(cw.get("windspeed", 0), 1),
                            "source": "open-meteo",
                        }
    except Exception:
        pass
    return None


async def _openmeteo_current(district: str, lat: float, lon: float) -> Dict:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                settings.open_meteo_url,
                params={"latitude": lat, "longitude": lon, "current_weather": "true"},
            )
            if resp.status_code == 200:
                cw = resp.json().get("current_weather", {})
                return {
                    "district": district,
                    "temp_c": cw.get("temperature"),
                    "wind_kph": cw.get("windspeed"),
                    "condition_code": cw.get("weathercode"),
                    "source": "open-meteo",
                }
    except Exception:
        pass
    return {"error": "Failed to fetch weather"}
