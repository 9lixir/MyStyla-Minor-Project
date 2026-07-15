# harmony.py – Layer 1: color harmony scoring
"""
color_harmony.py
-----------------
Layer 1 of the matching engine: rule-based color harmony scoring in HSV
space (Complementary / Analogous / Triadic), per section 3.4.4.1 of the
proposal. This captures deliberate high-contrast pairings that pure
embedding similarity would incorrectly penalize.

Input colors are expected in the same format extract_colors() produces:
    {"rgb": [r,g,b], "hsv": [h,s,v], "hex": "#rrggbb"}
with h in OpenCV's 0-179 range. We convert to degrees (0-360) internally.
"""

from typing import Any
from app.outfit_matching.config import HARMONY_RULES


def _hue_to_degrees(h_opencv: int) -> float:
    """OpenCV hue is 0-179; convert to the standard 0-360 color wheel degrees."""
    return h_opencv * 2.0


def _circular_hue_diff(h1_deg: float, h2_deg: float) -> float:
    diff = abs(h1_deg - h2_deg)
    return min(diff, 360 - diff)


def score_hue_pair(h1_opencv: int, h2_opencv: int) -> dict[str, Any]:
    """Score a single pair of hues against every harmony rule and return the
    best match, e.g. {"type": "complementary", "score": 0.87, "diff_deg": 172}.

    Score is 1.0 at the rule's ideal angle, falling off linearly to 0.0 at
    the edge of its tolerance window. If no rule's window is hit, score is 0.
    """
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
    """Compare ALL dominant colors of garment_a against ALL of garment_b's,
    and return the best-matching pair. A garment usually has ~3 dominant
    colors (per extract_colors), and outfits look fine if ANY pairing of
    their colors harmonizes - not just the single most dominant one.
    """
    best = {"type": "none", "score": 0.0, "diff_deg": 0.0}
    for color_a in garment_a["colors"]:
        for color_b in garment_b["colors"]:
            result = score_hue_pair(color_a["hsv"][0], color_b["hsv"][0])
            if result["score"] > best["score"]:
                best = result
    return best


def score_outfit_harmony(garments: list[dict[str, Any]]) -> float:
    """Average harmony score across every pairwise combination of garments
    in a candidate outfit (e.g. top-bottom, top-outerwear, bottom-outerwear).
    """
    if len(garments) < 2:
        return 1.0  # a single-item "outfit" (e.g. dress only) has nothing to clash with

    pair_scores = []
    for i in range(len(garments)):
        for j in range(i + 1, len(garments)):
            pair_scores.append(score_garment_pair(garments[i], garments[j])["score"])

    return round(sum(pair_scores) / len(pair_scores), 3)