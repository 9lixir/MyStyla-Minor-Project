from app.outfit_matching.config import OCCASION

# normalization.py — add near the top, alongside category_map

STYLE_FAMILY_MAP = {
    # nepali
    "daura suruwal": "nepali", "gunyu cholo": "nepali", "haku patasi": "nepali",
    "labeda suruwal": "nepali", "dhaka topi": "nepali",
    # south Asian
    "saree": "south_asian", "kurti": "south_asian", "kurta": "south_asian",
    "lehenga": "south_asian", "sherwani": "south_asian", "dhoti": "south_asian",
    "salwar suit": "south_asian", "anarkali": "south_asian", "mojari": "south_asian",
    # western footwear (the ones causing the oxford+lehenga problem)
    "sneakers": "western", "boots": "western", "loafers": "western",
    "oxford shoes": "western", "heels": "universal", "flats": "universal", "sandals": "universal",
}

def get_style_family(category: str) -> str:
    return STYLE_FAMILY_MAP.get(str(category).lower(), "western")

def normalize_pipeline_tags(tags: dict) -> dict:
    """map classifier labels into matcher tags"""
    category_map = {
        #south asian garments
        "saree": "dress",
        "women_kurta": "top",
        "kurti" :"top",
        "men_kurta": "top",
        "lehenga": "dress",
        "dhoti": "bottom",
        "sherwani": "outerwear",
        "palazzo": "bottom",
        "dupatta": "outerwear",
        "petticoat": "bottom",

        # Tops
        "t-shirt": "top", "shirt": "top", "blouse": "top", "tank top": "top",
        "polo": "top", "crop top": "top", "tube top": "top", "bodysuit": "top",
        "sweater": "top", "cardigan": "top", "hoodie": "top", "sweatshirt": "top",
        "turtleneck": "top",
        
        # Outerwear
        "jacket": "outerwear", "denim jacket": "outerwear", "leather jacket": "outerwear",
        "blazer": "outerwear", "coat": "outerwear", "parka": "outerwear",
        "windbreaker": "outerwear", "vest": "outerwear",
        
        # Bottoms
        "jeans": "bottom", "trousers": "bottom", "chinos": "bottom",
        "cargo pants": "bottom", "joggers": "bottom", "leggings": "bottom",
        "shorts": "bottom", "skirt": "bottom", "mini skirt": "bottom",
        "maxi skirt": "bottom", "pleated skirt": "bottom",
        
        # Dresses & Sets
        "dress": "dress", "jumpsuit": "dress", "romper": "dress",
        "co-ord set": "dress", "gown": "dress", "suit": "dress", "tuxedo": "dress",
        
        # Nepali garments (standalone full outfits)
        "daura suruwal": "dress",
        "gunyu cholo": "dress",
        "haku patasi": "dress",
        "labeda suruwal": "dress",

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
        "style_family": get_style_family(tags.get("category", "")),
        "formality": formality_map.get(str(tags.get("formality", "")).lower(), "Casual"),
        "season": season_map.get(str(tags.get("season", "")).lower(), "Summer"),
        "pattern": pattern_map.get(str(tags.get("pattern", "")).lower(), "Solid"),
        "occasion": occasions or ["Casual"],
    }