import colorsys
import math

# --- Dictionary Mappings ---
STYLE_FOOTWEAR_OVERRIDE = {
    ("Formal", "south_asian"): "Mojari",
    ("Formal", "nepali"): "Mojari",
    ("Smart Casual", "south_asian"): "Juti",
    ("Smart Casual", "nepali"): "Juti",
}

ACCESSORY_TYPES = {
    "Casual": {
        "bag": "Canvas Tote",
        "footwear": "Sandals",
        "jewelry": "Minimal Jewelry",
        "watch": "Digital Watch",
    },
    "Smart Casual": {
        "bag": "Shoulder Bag",
        "footwear": "Loafers",
        "jewelry": "Simple Earrings",
        "watch": "Analog Watch",
        "belt": "Leather Belt",
    },
    "Formal": {
        "bag": "Structured Handbag",
        "footwear": "Oxford Shoes",
        "jewelry": "Statement Jewelry",
        "watch": "Elegant Watch",
        "belt": "Formal Belt",
    },
    "Athletic": {
        "bag": "Sport Sling Bag",
        "footwear": "Training Shoes",
        "jewelry": "Minimal Jewelry",
        "watch": "Fitness Watch",
    },
    "Festive": {
        "bag": "Embellished Clutch",
        "footwear": "Dress Shoes",
        "jewelry": "Statement Jewelry",
        "watch": "Elegant Watch",
    },
}

FOOTWEAR_BY_SEASON = {
    "Casual": {
        "Summer": "Sandals",
        "Winter": "Boots",
        "Spring": "Sneakers",
        "Autumn": "Sneakers",
    },
    "Smart Casual": {
        "Summer": "Low Heels",
        "Winter": "Ankle Boots",
        "Spring": "Loafers",
        "Autumn": "Loafers",
    },
    "Formal": {
        "Summer": "Heels",
        "Winter": "Knee-High Boots",
        "Spring": "Oxford Shoes",
        "Autumn": "Oxford Shoes",
    },
}

# Practical items (bag/footwear/belt/hat) are basics - they vary by outfit
# brightness rather than hue, and stay consistent with each other within
# one suggestion. Statement items (jewelry/watch) follow the color-harmony
# hue logic instead.
PRACTICAL_SLOTS = {"bag", "footwear", "belt", "hat"}
STATEMENT_SLOTS = {"jewelry", "watch"}

# Only bag/footwear check the user's own wardrobe first; other accessories
# always use the generic rule.
WARDROBE_CHECKED_SLOTS = {
    "bag",
    "footwear",
    "jewelry",
    "watch",
    "belt",
    "hat",
    "scarf",
    "gloves",
    "tie",
    "sunglasses",
}

TONE_PREFIX = {
    "warm": "Gold",
    "cool": "Silver",
    "neutral": "Emerald",
    "accent": "Emerald",
}

# Light outfits get grounded with a dark neutral, dark outfits get lifted
# with a light neutral, mid-tone outfits get an earthy brown.
PRACTICAL_TONE_BY_BRIGHTNESS = {
    "light_outfit": "Black",
    "mid_outfit": "Brown",
    "dark_outfit": "White",
}

# Outfit-tone classification thresholds
NEUTRAL_SATURATION_THRESHOLD = 0.20   # avg saturation below this = "neutral" outfit
MULTICOLOR_SPREAD_THRESHOLD = 0.5     # circular resultant length below this = "multicolored"


def hex_to_hsv(hex_color: str) -> tuple[float, float, float]:
    """Convert hex string to standard HSV tuple (0-360, 0-1, 0-1)."""
    hex_color = hex_color.lstrip("#")
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    return h * 360.0, s, v


def collect_hsv(garments: list[dict]) -> list[tuple[float, float, float]]:
    """Safely extract HSV tuples regardless of input data structure."""
    hsv_values = []
    for garment in garments:
        colors = garment.get("dominant_colors") or garment.get("colors") or []
        for color in colors:
            if isinstance(color, dict):
                if "hex" in color and color["hex"]:
                    hsv_values.append(hex_to_hsv(color["hex"]))
                elif "hsv" in color and len(color["hsv"]) == 3:
                    h_opencv, s, v = color["hsv"]
                    hsv_values.append((h_opencv * 2.0, s / 255.0, v / 255.0))
            elif isinstance(color, str):
                hsv_values.append(hex_to_hsv(color))
    return hsv_values


def circular_mean_and_spread(hues: list[float]) -> tuple[float, float]:
    """Calculate directional circular mean and spread for hue degrees."""
    if not hues:
        return 0.0, 1.0
    radians = [math.radians(h) for h in hues]
    sin_sum = sum(math.sin(r) for r in radians)
    cos_sum = sum(math.cos(r) for r in radians)
    n = len(hues)
    resultant_length = math.sqrt(sin_sum**2 + cos_sum**2) / n
    mean_deg = math.degrees(math.atan2(sin_sum, cos_sum)) % 360.0
    return mean_deg, resultant_length


def is_warm_hue(hue: float) -> bool:
    return hue < 90 or hue >= 270


# --- Outfit Analysis ---

def classify_outfit_tone(garments: list[dict]) -> str:
    """Classify overall outfit tone into warm, cool, neutral, or multicolored."""
    hsv_values = collect_hsv(garments)
    if not hsv_values:
        return "neutral"

    hues = [h for h, s, v in hsv_values]
    saturations = [s for h, s, v in hsv_values]
    avg_saturation = sum(saturations) / len(saturations)

    if avg_saturation < NEUTRAL_SATURATION_THRESHOLD:
        return "neutral"

    mean_hue, resultant_length = circular_mean_and_spread(hues)
    if resultant_length < MULTICOLOR_SPREAD_THRESHOLD:
        return "multicolored"

    return "warm-dominant" if is_warm_hue(mean_hue) else "cool-dominant"


def get_accessory_tone(outfit_classification: str) -> str:
    """Map outfit classification to complementary accessory tone target."""
    return {
        "warm-dominant": "cool",
        "cool-dominant": "warm",
        "multicolored": "neutral",
        "neutral": "accent",
    }[outfit_classification]


def get_average_brightness(garments: list[dict]) -> float:
    """Average V (value/brightness) across all outfit colors, 0.0-1.0."""
    hsv_values = collect_hsv(garments)
    if not hsv_values:
        return 0.5
    return sum(v for h, s, v in hsv_values) / len(hsv_values)


def classify_outfit_brightness(avg_value: float) -> str:
    if avg_value >= 0.65:
        return "light_outfit"
    elif avg_value >= 0.35:
        return "mid_outfit"
    else:
        return "dark_outfit"


# --- Wardrobe-first check (bag/footwear only) ---

def get_wardrobe_accessories(user_id: str | None, slot: str, formality: str) -> list[dict]:
    """
    Algorithm 4, step 2: A_user = {a in Q : category(a)=slot AND formality(a)=f}
    Opens its own short-lived session, matching the pattern used by
    wardrobe_repository.get_wardrobe().
    """
    if not user_id:
        return []

    from app.database import SessionLocal
    from app.models import Garment, GarmentClassification

    db = SessionLocal()
    try:
        results = (
            db.query(Garment, GarmentClassification)
            .join(GarmentClassification, Garment.id == GarmentClassification.garment_id)
            .filter(
                GarmentClassification.user_id == user_id,
                GarmentClassification.category == slot,
                GarmentClassification.formality == formality,
            )
            .all()
        )
        return [
            {
                "filename": g.filename,
                "dominant_colors": g.dominant_colors,
                "cutout_path": g.cutout_path,
            }
            for g, classification in results
        ]
    finally:
        db.close()


def calculate_harmony(candidate_hue: float, outfit_hue: float) -> float:
    """
    Algorithm 4, step 6: Score(a_j) = CalculateHarmony(delta_h, h_bar).
    Peaks when candidate and outfit hues are ~180 degrees apart
    (complementary contrast).
    """
    delta_h = min(abs(candidate_hue - outfit_hue), 360 - abs(candidate_hue - outfit_hue))
    ideal_distance = 180.0
    sigma = 40.0
    return math.exp(-((delta_h - ideal_distance) ** 2) / (2 * sigma ** 2))


def select_best_wardrobe_match(candidates: list[dict], outfit_hue: float) -> dict | None:
    """Algorithm 4, steps 4-8: score every candidate by harmony, return arg max."""
    if not candidates:
        return None
    scored = []
    for candidate in candidates:
        candidate_hues = [h for h, s, v in collect_hsv([candidate])]
        if not candidate_hues:
            continue
        candidate_hue, _ = circular_mean_and_spread(candidate_hues)
        score = calculate_harmony(candidate_hue, outfit_hue)
        scored.append((score, candidate))
    if not scored:
        return None
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return scored[0][1]


def recommend_accessories(
    formality: str,
    garments: list[dict],
    season: str | None = None,
    user_id: str | None = None,
    style_family: str = "western",
) -> list[dict]:
    """Generate accessory recommendations with wardrobe-first matching."""
    formality_map = {
        "casual": "Casual",
        "smart casual": "Smart Casual",
        "business casual": "Smart Casual",
        "formal": "Formal",
        "athletic": "Athletic",
        "festive": "Festive",
        "traditional": "Festive",
        "festive/traditional": "Festive",
    }
    norm_formality = formality_map.get(str(formality).lower(), "Casual")
    accessory_types = ACCESSORY_TYPES[norm_formality]
    footwear_override = STYLE_FOOTWEAR_OVERRIDE.get((norm_formality, style_family))

    outfit_classification = classify_outfit_tone(garments)
    statement_tone = get_accessory_tone(outfit_classification)

    avg_brightness = get_average_brightness(garments)
    brightness_class = classify_outfit_brightness(avg_brightness)
    practical_tone_prefix = PRACTICAL_TONE_BY_BRIGHTNESS[brightness_class]

    outfit_hue, _ = circular_mean_and_spread([h for h, s, v in collect_hsv(garments)])

    results = []
    for slot, base_type in accessory_types.items():
        wardrobe_match = None
        if slot in WARDROBE_CHECKED_SLOTS:
            candidates = get_wardrobe_accessories(user_id, slot, norm_formality)
            wardrobe_match = select_best_wardrobe_match(candidates, outfit_hue)

        if wardrobe_match:
            results.append({
                "slot": slot,
                "name": wardrobe_match["filename"],
                "source": "wardrobe",
                "reason": f"You already own a compatible {slot} item",
                "confidence": 100,
                "cutout_path": wardrobe_match.get("cutout_path"),
            })
            continue

        # Footwear varies by season, if season is known
        if slot == "footwear" and season and season in FOOTWEAR_BY_SEASON.get(norm_formality, {}):
            base_type = FOOTWEAR_BY_SEASON[norm_formality][season]
        if slot == "footwear" and footwear_override:
            base_type = footwear_override

        if slot in PRACTICAL_SLOTS:
            tone_prefix = practical_tone_prefix
            season_note = f" for {season}" if slot == "footwear" and season else ""
            reason = (
                f"{slot.capitalize()} in {practical_tone_prefix.lower()} - a versatile neutral "
                f"that suits the outfit's {brightness_class.replace('_', ' ')} tone{season_note}"
            )
        else:
            tone_prefix = TONE_PREFIX[statement_tone]
            reason = f"Outfit is {outfit_classification} - a {statement_tone}-toned {slot} complements it"

        results.append({
            "slot": slot,
            "name": f"{tone_prefix} {base_type}",
            "source": "catalog",
            "reason": reason,
            "confidence": 75,
        })

    return results
