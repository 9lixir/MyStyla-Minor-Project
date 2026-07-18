from typing import Any
from app.outfit_matching.harmony import score_outfit_harmony
from app.outfit_matching.compatibility import score_outfit_compatibility
from app.outfit_matching.config import OUTFIT_TEMPLATES, OPTIONAL_CATEGORIES, W_COMPAT, W_HARMONY


def _generate_combinations(
    buckets: dict[str, list[dict[str, Any]]]
) -> list[list[dict[str, Any]]]:
    """generate valid outfit combinations"""
    candidates = []
    
    for template in OUTFIT_TEMPLATES:
        # skip templates with missing categories
        if not all(cat in buckets for cat in template):
            continue
        
        # build combinations for this template
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
        
        # append optional outerwear variants
        if "outerwear" in buckets and "outerwear" not in template:
            expanded = []
            for combo in template_combos:
                # keep base combo
                expanded.append(combo)
                # add each outerwear option
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
    """rank outfits by harmony and compatibility"""
    
    candidates = _generate_combinations(buckets)
    
    if not candidates:
        return []
    
    # score each outfit
    ranked = []
    for outfit in candidates:
        harmony_score = score_outfit_harmony(outfit)
        compat_score = score_outfit_compatibility(outfit)
        final_score = W_COMPAT * compat_score + W_HARMONY * harmony_score
        
        ranked.append({
            "garments": [
                {
                    "id": g["id"],
                    "filename": g.get("filename", g["id"]),
                    "cutout_path": g.get("cutout_path", ""),
                    "category": g["category"],
                    "dominant_colors": g.get("colors", []),
                    "tags": g.get("tags", {}),
                }
                for g in outfit
            ],
            "harmony_score": harmony_score,
            "compat_score": compat_score,
            "final_score": final_score,
        })
    
    # return top ranked outfits
    ranked.sort(key=lambda x: x["final_score"], reverse=True)
    return ranked[:top_k]
