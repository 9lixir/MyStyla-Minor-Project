# core outfit generation pipeline

from typing import Any

from app.outfit_matching.dummy_data import get_wardrobe
from app.outfit_matching.occasion_filter import filter_by_occasion, group_by_category
from app.outfit_matching.ranker import rank_outfits
from app.outfit_matching.models import validate_garment
from app.outfit_matching.config import DEFAULT_TOP_K


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

    return {
        "message": f"Generated {len(outfits)} outfit(s) for occasion '{occasion}'",
        "occasion": occasion,
        "wardrobe_size_after_filter": len(filtered),
        "outfits": outfits,
    }


if __name__ == "__main__":
    import json
    result = generate_outfits(user_id="demo_user", occasion="Office", top_k=5)
    print(json.dumps(result, indent=2))
