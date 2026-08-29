from typing import Any
import logging

logger = logging.getLogger(__name__)

from app.outfit_matching.category_ontology import structural_compatibility_multiplier
from app.outfit_matching.compatibility import score_garment_pair
from app.outfit_matching.config import DEFAULT_TOP_K
from app.outfit_matching.models import validate_garment
from app.outfit_matching.occasion_filter import filter_by_occasion, group_by_category
from app.outfit_matching.ranker import rank_outfits
from app.outfit_matching.wardrobe_repository import get_wardrobe
from app.outfit_matching.weather_scoring import (
    excludes_outerwear,
    garment_weather_score,
    requires_outerwear,
)
from app.recommendation import recommend_accessories
from app.scanning.vector_store import search_similar_filtered


def _outfit_formality(garments: list[dict[str, Any]]) -> str:
    priority = {"Festive": 5, "Formal": 4, "Smart Casual": 3, "Athletic": 2, "Casual": 1}
    values = [str(g.get("tags", {}).get("formality", "Casual")) for g in garments]
    return max(values or ["Casual"], key=lambda value: priority.get(value, 0))

def _outfit_style_family(garments: list[dict[str, Any]]) -> str:
    """if any garment is nepali/south_asian, treat the outfit as that family"""
    values = [g.get("tags", {}).get("style_family", "western") for g in garments]
    for family in ("nepali", "south_asian"):
        if family in values:
            return family
    return "western"


def _weather_prefiltered(garments: list[dict[str, Any]], weather: dict[str, Any] | None) -> list[dict[str, Any]]:
    """Only used to keep combinatorics sane on large wardrobes -- drops the
    genuinely unsuitable, everything else is scored (not excluded) by the
    ranker via outfit_weather_score."""
    if not weather:
        return garments
    temperature = weather.get("temperature_c") if isinstance(weather, dict) else None
    if not isinstance(temperature, (int, float)):
        return garments
    weather_mode, temp_c = _weather_mode_and_temperature(weather)
    outerwear_required = requires_outerwear(weather_mode, temp_c)
    outerwear_excluded = excludes_outerwear(weather_mode, temp_c)

    def _allowed(g: dict[str, Any]) -> bool:
        is_outerwear = g.get("category") == "outerwear"
        if outerwear_excluded and is_outerwear:
            return False
        return (
            garment_weather_score(str(g.get("tags", {}).get("season", "")), temperature) >= 0.2
            or (outerwear_required and is_outerwear)
        )
    kept = [g for g in garments if _allowed(g)]
    if temperature <= 14:
        return kept
    if kept:
        return kept
    # Fallback for an over-aggressive filter, but never let outerwear back in
    # when it's genuinely hot, that was the original bug.
    return [g for g in garments if not (outerwear_excluded and g.get("category") == "outerwear")]


def requires_outerwear(weather_mode: str | None, temp_c: float | None) -> bool:
    mode = str(weather_mode or "").strip().lower()
    is_cold_mode = "cold" in mode
    is_rainy_mode = "rain" in mode
    is_cold_temperature = isinstance(temp_c, (int, float)) and temp_c < 15
    return is_cold_mode or is_rainy_mode or is_cold_temperature


def _weather_mode_and_temperature(weather: dict[str, Any] | None) -> tuple[str | None, float | None]:
    if not isinstance(weather, dict):
        return None, None

    mode = (
        weather.get("weather_mode")
        or weather.get("mode")
        or weather.get("style_profile")
        or weather.get("condition")
    )
    # Outerwear decisions follow how the weather FEELS, not the raw air temp:
    # a 26C day that feels like 33C should not ask for a jacket.
    temperature = weather.get("feels_like_c")
    if not isinstance(temperature, (int, float)):
        temperature = weather.get("temperature_c")
    if not isinstance(temperature, (int, float)):
        temperature = None
    return str(mode) if mode is not None else None, temperature


def _category_counts(garments: list[dict[str, Any]]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for garment in garments:
        category = str(garment.get("category") or "unknown")
        counts[category] = counts.get(category, 0) + 1
    return counts


def generate_outfits(user_id, occasion, top_k=DEFAULT_TOP_K, weather=None):
    wardrobe = get_wardrobe(user_id)
    for garment in wardrobe:
        validate_garment(garment)

    
    occasion_filtered = filter_by_occasion(wardrobe, occasion)
    if not occasion_filtered:
        logger.warning(
            "No garments matched occasion '%s'; falling back to full wardrobe",
            occasion,
        )
        occasion_filtered = wardrobe
    filtered = _weather_prefiltered(occasion_filtered, weather)


    weather_mode, temp_c = _weather_mode_and_temperature(weather)
    outerwear_required = requires_outerwear(weather_mode, temp_c) and not excludes_outerwear(weather_mode, temp_c)
    buckets = group_by_category(filtered)
    outfits = rank_outfits(
        filtered,
        buckets,
        top_k=top_k,
        weather=weather,
        require_outerwear=outerwear_required,
    )
    for outfit in outfits:
        formality = _outfit_formality(outfit["garments"])
        outfit["formality"] = formality
        style_family = _outfit_style_family(outfit["garments"])
        season = next(
            (
                garment.get("tags", {}).get("season")
                for garment in outfit["garments"]
                if garment.get("tags", {}).get("season")
            ),
            None,
        )
        outfit["accessories"] = recommend_accessories(
            formality,
            outfit["garments"],
            season=season,
            user_id=user_id,
            style_family=style_family,
        )

    return {
        "message": f"Generated {len(outfits)} outfit(s) for occasion '{occasion}'",
        "occasion": occasion, "weather": weather,
        "outerwear_required": outerwear_required,
        "wardrobe_size_after_filter": len(filtered),
        "category_counts_after_filter": _category_counts(filtered),
        "outfits": outfits,
    }


def _serialize_match(candidate: dict[str, Any], score: float, weather: dict[str, Any] | None = None) -> dict[str, Any]:
    temperature = (weather or {}).get("temperature_c") if isinstance(weather, dict) else None
    return {
        "id": candidate["id"],
        "filename": candidate.get("filename", candidate["id"]),
        "cutout_path": candidate.get("cutout_path", ""),
        "category": candidate["category"],
        "dominant_colors": candidate.get("colors", []),
        "tags": candidate.get("tags", {}),
        "compatibility_score": round(score, 3),
        "weather_score": garment_weather_score(
            str(candidate.get("tags", {}).get("season", "")),
            temperature if isinstance(temperature, (int, float)) else None,
        ),
    }


def build_around_garment(
    user_id: str,
    garment_id: str,
    occasion: str | None = None,
    top_k: int = 5,
    weather: dict[str, Any] | None = None,
) -> dict[str, Any]:
    wardrobe = get_wardrobe(user_id)
    for garment in wardrobe:
        validate_garment(garment)

    anchor = next((g for g in wardrobe if g["id"] == garment_id), None)
    if anchor is None:
        raise ValueError(f"Garment '{garment_id}' was not found")

    anchor_category = anchor.get("category", "").lower()
    candidates = [
        g for g in wardrobe
        if g["id"] != garment_id and g.get("category", "").lower() != anchor_category
    ]
    candidates = [
        g for g in candidates
        if structural_compatibility_multiplier(anchor, g) > 0.0
    ]
    if occasion:
        candidates = filter_by_occasion(candidates, occasion)
    candidates = _weather_prefiltered(candidates, weather)

    if not candidates:
        return {
            "message": "No compatible garments found for the selected filters",
            "anchor_garment": _serialize_match(anchor, 1.0, weather),
            "occasion": occasion,
            "weather": weather,
            "matches": [],
        }

    candidate_by_id = {candidate["id"]: candidate for candidate in candidates}
    shortlist_size = min(max(top_k * 4, top_k), len(candidates))

    try:
        shortlist = search_similar_filtered(
            anchor["embedding"],
            candidate_ids=list(candidate_by_id.keys()),
            occasion=occasion,
            top_k=shortlist_size,
            with_vectors=True,
        )
    except Exception:
        shortlist = []

    scored_matches: list[tuple[float, dict[str, Any]]] = []
    for result in shortlist:
        candidate = candidate_by_id.get(result["id"])
        vector = result.get("vector")
        if candidate is None or not vector:
            continue

        rerank_candidate = {**candidate, "embedding": vector}
        scored_matches.append((score_garment_pair(anchor, rerank_candidate), rerank_candidate))

    if not scored_matches:
        scored_matches = [
            (score_garment_pair(anchor, candidate), candidate)
            for candidate in candidates
        ]

    scored_matches.sort(
        key=lambda item: (
            0.8 * item[0]
            + 0.2 * _serialize_match(item[1], item[0], weather)["weather_score"]
        ),
        reverse=True,
    )
    matches = [_serialize_match(candidate, score, weather) for score, candidate in scored_matches[:top_k]]

    return {
        "message": f"Found {len(matches)} match(es) for '{anchor.get('filename', garment_id)}'",
        "occasion": occasion,
        "weather": weather,
        "anchor_garment": _serialize_match(anchor, 1.0, weather),
        "matches": matches,
    }