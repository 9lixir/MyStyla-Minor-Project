# core outfit generation pipeline

from typing import Any

from app.outfit_matching.dummy_data import get_wardrobe
from app.outfit_matching.occasion_filter import filter_by_occasion, group_by_category
from app.outfit_matching.ranker import rank_outfits
from app.outfit_matching.models import validate_garment
from app.outfit_matching.config import DEFAULT_TOP_K
from app.outfit_matching.compatibility import score_garment_pair
from app.recommendation import recommend_accessories
from app.scanning.vector_store import search_similar_filtered


def _outfit_formality(garments: list[dict[str, Any]]) -> str:
    """choose the strongest formality in the outfit"""
    order = {"Casual": 0, "Smart Casual": 1, "Formal": 2}
    values = [g.get("tags", {}).get("formality", "Casual") for g in garments]
    return max(values, key=lambda value: order.get(value, 0), default="Casual")


def generate_outfits(user_id: str, occasion: str, top_k: int = DEFAULT_TOP_K) -> dict[str, Any]:
    wardrobe = get_wardrobe(user_id)

    for garment in wardrobe:
        validate_garment(garment)  # validate real data before scoring

    filtered = filter_by_occasion(wardrobe, occasion)
    if not filtered:
        return {
            "message": f"No garments tagged for occasion '{occasion}'",
            "occasion": occasion,
            "outfits": [],
        }

    buckets = group_by_category(filtered)
    outfits = rank_outfits(filtered, buckets, top_k=top_k)
    for outfit in outfits:
        formality = _outfit_formality(outfit["garments"])
        outfit["formality"] = formality
        outfit["accessories"] = recommend_accessories(formality, outfit["garments"])

    return {
        "message": f"Generated {len(outfits)} outfit(s) for occasion '{occasion}'",
        "occasion": occasion,
        "wardrobe_size_after_filter": len(filtered),
        "outfits": outfits,
    }


def _serialize_match(candidate: dict[str, Any], score: float) -> dict[str, Any]:
    return {
        "id": candidate["id"],
        "filename": candidate.get("filename", candidate["id"]),
        "cutout_path": candidate.get("cutout_path", ""),
        "category": candidate["category"],
        "dominant_colors": candidate.get("colors", []),
        "tags": candidate.get("tags", {}),
        "compatibility_score": round(score, 3),
    }


def build_around_garment(
    user_id: str,
    garment_id: str,
    occasion: str | None = None,
    top_k: int = DEFAULT_TOP_K,
) -> dict[str, Any]:
    wardrobe = get_wardrobe(user_id)
    for garment in wardrobe:
        validate_garment(garment)

    anchor = next((g for g in wardrobe if g["id"] == garment_id), None)
    if anchor is None:
        raise ValueError(f"Garment '{garment_id}' not found in wardrobe")

    candidates = [g for g in wardrobe if g["id"] != garment_id]
    if occasion:
        candidates = filter_by_occasion(candidates, occasion)

    if not candidates:
        return {
            "message": "No compatible garments found for the selected filters",
            "anchor_garment": _serialize_match(anchor, 1.0),
            "occasion": occasion,
            "matches": [],
        }

    candidate_by_id = {candidate["id"]: candidate for candidate in candidates}

    shortlist_size = min(max(top_k * 4, top_k), len(candidates))
    shortlist = search_similar_filtered(
        anchor["embedding"],
        candidate_ids=list(candidate_by_id.keys()),
        occasion=occasion,
        top_k=shortlist_size,
        with_vectors=True,
    )

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

    scored_matches.sort(key=lambda item: item[0], reverse=True)
    matches = [_serialize_match(candidate, score) for score, candidate in scored_matches[:top_k]]

    return {
        "message": f"Found {len(matches)} wardrobe match(es) for '{anchor.get('filename', garment_id)}'",
        "anchor_garment": _serialize_match(anchor, 1.0),
        "occasion": occasion,
        "matches": matches,
    }


if __name__ == "__main__":
    import json
    result = generate_outfits(user_id="demo_user", occasion="Office", top_k=5)
    print(json.dumps(result, indent=2))
