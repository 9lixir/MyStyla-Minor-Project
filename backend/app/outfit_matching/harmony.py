# color harmony scoring

from typing import Any
from app.outfit_matching.config import HARMONY_RULES


def _hue_to_degrees(h_opencv: int) -> float:
    """convert opencv hue to color wheel degrees"""
    return h_opencv * 2.0


def _circular_hue_diff(h1_deg: float, h2_deg: float) -> float:
    diff = abs(h1_deg - h2_deg)
    return min(diff, 360 - diff)


def score_hue_pair(h1_opencv: int, h2_opencv: int) -> dict[str, Any]:
    """score a single pair of hues"""
    diff = _circular_hue_diff(_hue_to_degrees(h1_opencv), _hue_to_degrees(h2_opencv))

    best_type, best_score = "none", 0.0
    for harmony_type, rule in HARMONY_RULES.items():
        deviation = abs(diff - rule["center"])
        if deviation <= rule["tolerance"]:
            score = 1.0 - (deviation / rule["tolerance"])
            if score > best_score:
                best_type, best_score = harmony_type, score

    return {"type": best_type, "score": round(best_score, 3), "diff_deg": round(diff, 1)}


def score_garment_pair(garment_a: dict[str, Any], garment_b: dict[str, Any]) -> dict[str, Any]:
    """score the best color pairing between two garments"""
    best = {"type": "none", "score": 0.0, "diff_deg": 0.0}
    for color_a in garment_a["colors"]:
        for color_b in garment_b["colors"]:
            result = score_hue_pair(color_a["hsv"][0], color_b["hsv"][0])
            if result["score"] > best["score"]:
                best = result
    return best


def score_outfit_harmony(garments: list[dict[str, Any]]) -> float:
    """average pairwise harmony for an outfit"""
    if len(garments) < 2:
        return 1.0  # single item outfits cannot clash

    pair_scores = []
    for i in range(len(garments)):
        for j in range(i + 1, len(garments)):
            pair_scores.append(score_garment_pair(garments[i], garments[j])["score"])

    return round(sum(pair_scores) / len(pair_scores), 3)
