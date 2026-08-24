from app.outfit_matching.category_ontology import enrich_matcher_tags, normalize_fine_category
from app.outfit_matching.config import OCCASION


def normalize_pipeline_tags(tags: dict) -> dict:
    """map classifier labels into matcher tags"""
    fine_category = normalize_fine_category(tags.get("fine_category") or tags.get("category"))
    category_map = {
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
        "dress": "dress", "jumpsuit": "dress", "romper": "dress",
        "co-ord set": "dress", "gown": "dress", "suit": "dress", "tuxedo": "dress",
    }
    formality_map = {
        "casual": "Casual",
        "business casual": "Smart Casual",
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
        "polka dot": "Graphic",
        "graphic print": "Graphic",
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

    normalized = {
        "category": category_map.get(fine_category, "top"),
        "fine_category": fine_category,
        "formality": formality_map.get(str(tags.get("formality", "")).lower(), "Casual"),
        "season": season_map.get(str(tags.get("season", "")).lower(), "All-Season"),
        "pattern": pattern_map.get(str(tags.get("pattern", "")).lower(), "Solid"),
        "occasion": occasions or ["Casual"],
    }
    return enrich_matcher_tags(normalized)