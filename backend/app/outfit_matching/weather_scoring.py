#Turns raw weather (from app.weather.service.fetch_current_weather) into per-garment and per-outfit suitability scores.

from typing import Any

# Comfortable temperature ranges per season. Scores use distance from these
# ranges instead of hard brackets, so boundary temperatures degrade smoothly.
SEASON_TEMP_RANGES: dict[str, tuple[float | None, float | None]] = {
    "Winter": (None, 12),
    "Autumn": (10, 20),
    "Spring": (17, 25),
    "Summer": (25, None),
}
TEMP_FALLOFF_C = 8.0
ALL_SEASON_SUITABILITY = 0.85
BASE_SUITABILITY = 0.15
UNKNOWN_TEMP_SUITABILITY = 0.6  # no weather passed in don't reward or punish

WARM_LAYER_SUBROLES = {"light_outer_layer", "outer_layer", "formal_layer", "heavy_outer_layer"}
HEAVY_LAYER_SUBROLES = {"outer_layer", "heavy_outer_layer"}


def garment_weather_score(season: str, temperature_c: float | None) -> float:
    if temperature_c is None:
        return UNKNOWN_TEMP_SUITABILITY
    if season == "All-Season":
        return ALL_SEASON_SUITABILITY

    temp_range = SEASON_TEMP_RANGES.get(season)
    if temp_range is None:
        return BASE_SUITABILITY

    lo, hi = temp_range
    if lo is not None and temperature_c < lo:
        distance = lo - temperature_c
    elif hi is not None and temperature_c > hi:
        distance = temperature_c - hi
    else:
        distance = 0.0

    if distance == 0:
        return 1.0

    score = 1.0 - ((1.0 - BASE_SUITABILITY) * (distance / TEMP_FALLOFF_C))
    return round(max(BASE_SUITABILITY, min(1.0, score)), 3)


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
