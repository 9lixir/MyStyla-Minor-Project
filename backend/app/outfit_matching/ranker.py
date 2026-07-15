"""
ranker.py – Generate outfit combinations and rank by score
"""

from typing import Any
from app.outfit_matching.harmony import score_outfit_harmony
from app.outfit_matching.compatibility import score_outfit_compatibility
from app.outfit_matching.config import OUTFIT_TEMPLATES, OPTIONAL_CATEGORIES, W_COMPAT, W_HARMONY


def _generate_combinations(
    buckets: dict[str, list[dict[str, Any]]]
) -> list[list[dict[str, Any]]]:
    """Generate all valid outfit combinations using templates.
    
    For each template, generate the Cartesian product of garments in those
    categories. Optionally append outerwear if it exists.
    """
    candidates = []
    
    for template in OUTFIT_TEMPLATES:
        # Check if all categories in template exist
        if not all(cat in buckets for cat in template):
            continue
        
        # Build Cartesian product for this template
        def cartesian_product(cats):
            if not cats:
                return [[]]
            head_cat = cats[0]
            tail_combos = cartesian_product(cats[1:])
            result = []
            for item in buckets[head_cat]:
                for combo in tail_combos:
                    result.append([item] + combo)
            return result
        
        template_combos = cartesian_product(template)
        
        # Optionally append outerwear to each combo
        if "outerwear" in buckets and "outerwear" not in template:
            expanded = []
            for combo in template_combos:
                # add combo without outerwear
                expanded.append(combo)
                # add combo with each outerwear
                for outer in buckets["outerwear"]:
                    expanded.append(combo + [outer])
            candidates.extend(expanded)
        else:
            candidates.extend(template_combos)
    
    return candidates


def rank_outfits(
    wardrobe: list[dict[str, Any]],
    buckets: dict[str, list[dict[str, Any]]],
    top_k: int = 10,
) -> list[dict[str, Any]]:
    """Generate all outfit combinations and rank by (harmony + compatibility)."""
    
    candidates = _generate_combinations(buckets)
    
    if not candidates:
        return []
    
    # Score each outfit
    ranked = []
    for outfit in candidates:
        harmony_score = score_outfit_harmony(outfit)
        compat_score = score_outfit_compatibility(outfit)
        final_score = W_COMPAT * compat_score + W_HARMONY * harmony_score
        
        ranked.append({
            "garments": [
                {
                    "id": g["id"],
                    "category": g["category"],
                    "dominant_colors": g.get("colors", []),
                }
                for g in outfit
            ],
            "harmony_score": harmony_score,
            "compat_score": compat_score,
            "final_score": final_score,
        })
    
    # Sort by final score descending, return top K
    ranked.sort(key=lambda x: x["final_score"], reverse=True)
    return ranked[:top_k]
