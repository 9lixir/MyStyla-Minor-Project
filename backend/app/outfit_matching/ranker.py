from typing import Any
from app.outfit_matching.category_ontology import is_structurally_valid_outfit
from app.outfit_matching.harmony import score_outfit_harmony
from app.outfit_matching.compatibility import score_outfit_compatibility
from app.outfit_matching.weather_scoring import outfit_weather_score
from app.outfit_matching.config import OPTIONAL_CATEGORIES, OUTFIT_TEMPLATES, W_COMPAT, W_HARMONY, W_WEATHER


def _generate_combinations(buckets: dict[str, list[dict[str, Any]]]) -> list[list[dict[str, Any]]]:
    """Build valid outfit candidates from configured templates."""
    candidates: list[list[dict[str, Any]]] = []

    for template in OUTFIT_TEMPLATES:
        if any(not buckets.get(category) for category in template):
            continue

        partials: list[list[dict[str, Any]]] = [[]]
        for category in template:
            partials = [partial + [garment] for partial in partials for garment in buckets[category]]

        candidates.extend(partials)

    for optional_category in OPTIONAL_CATEGORIES:
        optional_items = buckets.get(optional_category, [])
        if not optional_items:
            continue

        layered = [
            outfit + [item]
            for outfit in candidates
            for item in optional_items
            if item not in outfit
        ]
        candidates.extend(layered)

    return candidates

def rank_outfits(
    wardrobe: list[dict[str, Any]],
    buckets: dict[str, list[dict[str, Any]]],
    top_k: int = 10,
    weather: dict[str, Any] | None = None,
    require_outerwear: bool = False,
) -> list[dict[str, Any]]:
    candidates = _generate_combinations(buckets)
    if require_outerwear:
        with_outer = [
            outfit for outfit in candidates
            if any(g.get("category") == "outerwear" for g in outfit)
        ]
        # Prefer outfits with outerwear when available, but never dead-end to
        # zero just because the wardrobe (or the templates) have none.
        candidates = with_outer or candidates
    if not candidates:
        return []

    ranked = []
    for outfit in candidates:
        if not is_structurally_valid_outfit(outfit):
            continue

        harmony_score = score_outfit_harmony(outfit)
        compat_score = score_outfit_compatibility(outfit)
        weather_score = outfit_weather_score(outfit, weather)
        final_score = (
            W_COMPAT * compat_score + W_HARMONY * harmony_score + W_WEATHER * weather_score
        )

        ranked.append({
            "garments": [
                {
                    "id": g["id"], "filename": g.get("filename", g["id"]),
                    "cutout_path": g.get("cutout_path", ""), "category": g["category"],
                    "dominant_colors": g.get("colors", []), "tags": g.get("tags", {}),
                }
                for g in outfit
            ],
            "harmony_score": harmony_score,
            "compat_score": compat_score,
            "weather_score": weather_score,
            "final_score": round(final_score, 3),
        })

    ranked.sort(key=lambda x: x["final_score"], reverse=True)
    return ranked[:top_k]