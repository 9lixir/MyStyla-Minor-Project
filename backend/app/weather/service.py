from typing import Any

import httpx


OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


WEATHER_CODE_LABELS = {
    0: "clear",
    1: "mainly clear",
    2: "partly cloudy",
    3: "overcast",
    45: "fog",
    48: "depositing rime fog",
    51: "light drizzle",
    53: "moderate drizzle",
    55: "dense drizzle",
    56: "light freezing drizzle",
    57: "dense freezing drizzle",
    61: "slight rain",
    63: "moderate rain",
    65: "heavy rain",
    66: "light freezing rain",
    67: "heavy freezing rain",
    71: "slight snow",
    73: "moderate snow",
    75: "heavy snow",
    77: "snow grains",
    80: "slight rain showers",
    81: "moderate rain showers",
    82: "violent rain showers",
    85: "slight snow showers",
    86: "heavy snow showers",
    95: "thunderstorm",
    96: "thunderstorm with slight hail",
    99: "thunderstorm with heavy hail",
}


def _style_weather_profile(
    temperature_c: float | None,
    precipitation_mm: float | None,
    weather_code: int | None,
) -> str:
    """Convert raw weather into a simple styling profile for later outfit rules."""
    is_rainy = (precipitation_mm or 0) > 0 or weather_code in {
        51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99
    }
    is_snowy = weather_code in {71, 73, 75, 77, 85, 86}

    if is_snowy:
        return "cold_snowy"
    if temperature_c is not None and temperature_c <= 10:
        return "cold_rainy" if is_rainy else "cold"
    if temperature_c is not None and temperature_c >= 27:
        return "hot_rainy" if is_rainy else "hot"
    if is_rainy:
        return "mild_rainy"
    return "mild"


async def fetch_current_weather(latitude: float, longitude: float) -> dict[str, Any]:
    """Fetch current weather and return only the fields the app needs.
    Open-Meteo is used here because it provides current weather without an API key, which keeps local setup simple for every teammate.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": ",".join(
            [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "precipitation",
                "rain",
                "showers",
                "snowfall",
                "weather_code",
                "wind_speed_10m",
            ]
        ),
        "timezone": "auto",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(OPEN_METEO_FORECAST_URL, params=params)
        response.raise_for_status()
        payload = response.json()

    current = payload.get("current") or {}
    weather_code = current.get("weather_code")
    precipitation = current.get("precipitation")
    temperature = current.get("temperature_2m")

    return {
        "latitude": payload.get("latitude"),
        "longitude": payload.get("longitude"),
        "timezone": payload.get("timezone"),
        "time": current.get("time"),
        "temperature_c": temperature,
        "feels_like_c": current.get("apparent_temperature"),
        "humidity_percent": current.get("relative_humidity_2m"),
        "precipitation_mm": precipitation,
        "rain_mm": current.get("rain"),
        "showers_mm": current.get("showers"),
        "snowfall_cm": current.get("snowfall"),
        "wind_kph": current.get("wind_speed_10m"),
        "weather_code": weather_code,
        "condition": WEATHER_CODE_LABELS.get(weather_code, "unknown"),
        "style_profile": _style_weather_profile(temperature, precipitation, weather_code),
    }
