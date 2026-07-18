from app.outfit_matching.config import OCCASION


def normalize_pipeline_tags(tags: dict) -> dict:
    """map classifier labels into matcher tags"""
    category_map = {
        "shirt": "top",
        "t-shirt": "top",
        "sweater": "top",
        "jacket": "outerwear",
        "dress": "dress",
        "jeans": "bottom",
        "skirt": "bottom",
        "shorts": "bottom",
    }
    formality_map = {
        "casual": "Casual",
        "business casual": "Smart Casual",
        "formal": "Formal",
        "athletic": "Casual",
    }
    season_map = {
        "spring": "Spring",
        "summer": "Summer",
        "autumn": "Autumn",
        "winter": "Winter",
        "all-season": "Summer",
    }
    pattern_map = {
        "solid": "Solid",
        "striped": "Striped",
        "floral": "Floral",
        "plaid": "Checked",
        "polka dot": "Graphic",
        "graphic print": "Graphic",
    }
    occasion_map = {
        "everyday wear": "Casual",
        "work": "Office",
        "party": "Party",
        "workout": "Casual",
        "formal event": "Farewell",
    }

    raw_occasion = tags.get("occasion")
    raw_occasions = raw_occasion if isinstance(raw_occasion, list) else [raw_occasion]
    occasions = [occasion_map.get(str(value).lower(), value) for value in raw_occasions if value]
    occasions = [value for value in occasions if value in OCCASION]

    return {
        "category": category_map.get(str(tags.get("category", "")).lower(), "top"),
        "formality": formality_map.get(str(tags.get("formality", "")).lower(), "Casual"),
        "season": season_map.get(str(tags.get("season", "")).lower(), "Summer"),
        "pattern": pattern_map.get(str(tags.get("pattern", "")).lower(), "Solid"),
        "occasion": occasions or ["Casual"],
    }
