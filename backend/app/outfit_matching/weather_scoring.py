#Turns raw weather (from app.weather.service.fetch_current_weather) into per-garment and per-outfit suitability scores.

from typing import Any

# (min_temp_inclusive, max_temp_exclusive) -> {season: suitability}
# Seasons not listed in a band fall back to BASE_SUITABILITY (technically
# wearable, badly matched) rather than 0  we want to *rank*, not exclude,
# so a spring shirt on a 24C day still shows up, just lower than a perfect
# match.
WEATHER_BANDS: list[tuple[float, float, dict[str, float]]] = [
    (float("-inf"), 10,  {"Winter": 1.0, "Autumn": 0.55}),
    (10,   18,           {"Winter": 0.7, "Autumn": 1.0, "Spring": 0.55}),
    (18,   25,           {"Spring": 1.0, "Autumn": 0.7, "Summer": 0.55, "Winter": 0.3}),
    (25,   30,           {"Spring": 0.6, "Summer": 1.0, "Autumn": 0.3}),
    (30,   float("inf"), {"Summer": 1.0, "Spring": 0.3}),
]
ALL_SEASON_SUITABILITY = 0.85
BASE_SUITABILITY = 0.15
UNKNOWN_TEMP_SUITABILITY = 0.6  # no weather passed in don't reward or punish

WARM_LAYER_SUBROLES = {"light_outer_layer", "outer_layer", "formal_layer", "heavy_outer_layer"}
HEAVY_LAYER_SUBROLES = {"outer_layer", "heavy_outer_layer"}


def garment_weather_score(season: str, temperature_c: float | None) -> float:
    if season == "All-Season":
        return ALL_SEASON_SUITABILITY
    if temperature_c is None:
        return UNKNOWN_TEMP_SUITABILITY
    for lo, hi, table in WEATHER_BANDS:
        if lo <= temperature_c < hi:
            return table.get(season, BASE_SUITABILITY)
    return BASE_SUITABILITY


def outfit_weather_score(garments: list[dict[str, Any]], weather: dict[str, Any] | None) -> float:
    """Average per-garment suitability, adjusted for rain/wind coverage."""
    temperature = (weather or {}).get("temperature_c")
    per_garment = [
        garment_weather_score(str(g.get("tags", {}).get("season", "")), temperature)
        for g in garments
    ]
    base = sum(per_garment) / len(per_garment) if per_garment else UNKNOWN_TEMP_SUITABILITY

    if not weather:
        return round(base, 3)

    profile = str(weather.get("style_profile") or "")
    wind_kph = weather.get("wind_kph") or 0
    has_outerwear = any(g.get("category") == "outerwear" for g in garments)
    layer_subroles = {
        str(g.get("tags", {}).get("sub_role") or "")
        for g in garments
        if g.get("category") == "outerwear"
    }
    has_warm_layer = has_outerwear or any(sub_role in WARM_LAYER_SUBROLES for sub_role in layer_subroles)
    has_heavy_layer = any(sub_role in HEAVY_LAYER_SUBROLES for sub_role in layer_subroles)

    adjustment = 0.0
    is_cold = isinstance(temperature, (int, float)) and temperature <= 14
    needs_cover = "rainy" in profile or "snowy" in profile or wind_kph >= 25
    if is_cold:
        adjustment += 0.2 if has_warm_layer else -0.25
        if temperature <= 10:
            adjustment += 0.05 if has_heavy_layer else -0.05
    if needs_cover:
        adjustment += 0.1 if has_outerwear else -0.15
    elif "hot" in profile and has_outerwear:
        adjustment -= 0.15  # unnecessary layer in the heat

    return round(max(0.0, min(1.0, base + adjustment)), 3)
