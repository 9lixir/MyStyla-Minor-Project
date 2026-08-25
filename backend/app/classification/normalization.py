from app.outfit_matching.config import OCCASION


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

        # Footwear (all map to one slot name the accessory engine checks)
        "sneakers": "footwear", "boots": "footwear", "sandals": "footwear",
        "heels": "footwear", "flats": "footwear", "loafers": "footwear",


        # Accessories
        "bag": "bag",
        "jewelry": "jewelry",
        "watch": "watch",
        "belt": "belt",
        "hat": "hat",
        "scarf": "scarf",
        "gloves": "gloves",
        "tie": "tie",
        "sunglasses": "sunglasses",


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