from app.outfit_matching.category_ontology import enrich_matcher_tags, normalize_fine_category
from app.outfit_matching.config import OCCASION

# normalization.py — add near the top, alongside category_map

STYLE_FAMILY_MAP = {
        # nepali
    "daura suruwal": "nepali", "gunyu cholo": "nepali", "haku patasi": "nepali",
    "labeda suruwal": "nepali", "dhaka topi": "nepali",
    "bakkhu": "nepali", "gurung dress": "nepali",
    "phariya": "nepali", "cholo": "nepali", "patuka": "nepali",
    "ghalek": "nepali", "mujetro": "nepali",
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

def _apply_category_season_guard(category: str, season: str) -> str:
    """Keep season values consistent with obvious garment semantics."""
    cat = normalize_fine_category(category)
    season_key = str(season).strip().lower()

    warm_weather_categories = {
        "sandals", "sandal", "sneakers", "sneaker", "heels", "heel", "flat", "flats",
        "loafer", "loafers", "shorts", "tank top", "t-shirt", "crop top", "blouse",
        "dress", "saree", "lehenga", "kurti", "top",
    }
    cold_weather_categories = {
        "hoodie", "sweatshirt", "sweater", "cardigan", "jacket", "coat", "parka",
        "windbreaker", "boot", "boots", "scarf", "gloves", "vest",
    }

    if cat in warm_weather_categories and season_key in {"winter", "autumn"}:
        return "Summer"
    if cat in cold_weather_categories and season_key in {"summer", "spring"}:
        return "Winter"
    return season


def normalize_pipeline_tags(tags: dict) -> dict:
    """map classifier labels into matcher tags"""
    fine_category = normalize_fine_category(tags.get("fine_category") or tags.get("category"))
    category_map = {
        # Matcher broad categories. User edits already send these values.
        "top": "top",
        "bottom": "bottom",
        "dress": "dress",
        "outerwear": "outerwear",
        "footwear": "footwear",
        "accessories": "accessories",

        #south asian garments
        "saree": "dress",
        "women_kurta": "top",
        "women kurta": "top",
        "kurti" :"top",
        "men_kurta": "top",
        "men kurta": "top",
        "kurta_men": "top",
        "kurta men": "top",
        "lehenga": "dress",
        "dhoti": "bottom",
        "dhoti_pants": "bottom",
        "dhoti pants": "bottom",
        "sherwani": "dress",
        "sherwanis": "dress",
        "palazzo": "bottom",
        "palazzos": "bottom",
        "dupatta": "outerwear",
        "dupattas": "outerwear",
        "petticoat": "bottom",
        "petticoats": "bottom",

        # Tops
        "t-shirt": "top", "shirt": "top", "blouse": "top", "tank top": "top",
        "polo": "top", "crop top": "top", "tube top": "top", "bodysuit": "top",
        "sweater": "top", "cardigan": "outerwear", "hoodie": "top", "sweatshirt": "top",
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
        "jumpsuit": "dress", "romper": "dress",
        "co-ord set": "dress", "gown": "dress", "suit": "dress", "tuxedo": "dress",
        
        # Nepali garments (standalone full outfits)
        "daura suruwal": "dress",
        "gunyu cholo": "dress",
        "haku patasi": "dress",
        "labeda suruwal": "dress",
        "bakkhu": "dress",
        "gurung dress": "dress",

        # Nepali — Magar pieces
        "phariya": "bottom",     # wrap-skirt
        "cholo": "top",          # blouse

        # Footwear (all map to one slot name the accessory engine checks)
        "sneakers": "footwear", "sneaker": "footwear",
        "boots": "footwear", "boot": "footwear",
        "sandals": "footwear", "sandal": "footwear",
        "heels": "footwear", "heel": "footwear",
        "flats": "footwear", "flat": "footwear",
        "loafers": "footwear", "loafer": "footwear",
        "mojari": "footwear", "mojaris": "footwear",

        # Accessories
        "bag": "bag", "bags": "bag",
        "jewelry": "jewelry", "jewelery": "jewelry",
        "watch": "watch", "watches": "watch",
        "belt": "belt", "belts": "belt",
        "hat": "hat", "hats": "hat",
        "scarf": "scarf", "scarves": "scarf",
        "gloves": "gloves",
        "tie": "tie", "ties": "tie",
        "sunglasses": "sunglasses", "sunglass": "sunglasses",
        "accessories": "bag",


    }
    formality_map = {
    "casual": "Casual",
    "business casual": "Smart Casual",
    "smart casual": "Smart Casual",   # accept canonical on re-save
    "formal": "Formal",
    "athletic": "Athletic",
    "festive": "Festive",
    "traditional": "Festive",
    "festive/traditional": "Festive",
    }
    season_map = {
        "spring": "Spring",
        "summer": "Summer",
        "autumn": "Autumn",
        "winter": "Winter",
        "all-season": "All-Season",
    }
    pattern_map = {
    "solid": "Solid",
    "striped": "Striped",
    "floral": "Floral",
    "plaid": "Checked",
    "checked": "Checked",        # accept canonical on re-save
    "polka dot": "Graphic",
    "graphic print": "Graphic",
    "graphic": "Graphic",        # accept canonical on re-save
    }
    occasion_map = {
        "casual": "Casual",
        "everyday wear": "Casual",
        "college": "College",
        "shopping": "Shopping",
        "travel": "Travel",
        "work": "Office",
        "office": "Office",
        "meeting": "Meeting",
        "interview": "Interview",
        "presentation": "Presentation",
        "party": "Party",
        "date": "Date",
        "date night": "Date",
        "dinner": "Dinner",
        "birthday": "Birthday",
        "formal event": "Farewell",
        "farewell": "Farewell",
        "graduation": "Graduation",
        "wedding": "Wedding",
        "wedding guest outfit": "Wedding",
        "puja": "Puja",
        "religious ceremony": "Religious Ceremony",
        "puja or religious ceremony outfit": "Puja",
        "festival": "Festival",
        "festival celebration outfit": "Festival",
        "workout": "Casual",
        "loungewear": "Casual",
    }
    raw_occasion = tags.get("occasion")
    raw_occasions = raw_occasion if isinstance(raw_occasion, list) else [raw_occasion]
    occasions = [occasion_map.get(str(value).lower(), value) for value in raw_occasions if value]
    occasions = [value for value in occasions if value in OCCASION]

    raw_season = str(tags.get("season", "")).lower()
    safe_season = season_map.get(raw_season, "All-Season")
    safe_season = _apply_category_season_guard(fine_category, safe_season)

    normalized = {
        "category": category_map.get(fine_category, "top"),
        "fine_category": fine_category,
        "style_family": get_style_family(tags.get("category", "")),
        "formality": formality_map.get(str(tags.get("formality", "")).lower(), "Casual"),
        "season": safe_season,
        "pattern": pattern_map.get(str(tags.get("pattern", "")).lower(), "Solid"),
        "occasion": occasions or ["Casual"],
    }
    return enrich_matcher_tags(normalized)
