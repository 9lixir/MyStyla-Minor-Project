import colorsys
import math

# --- Dictionary Mappings ---

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
            # Handle dictionary formats (hex or opencv hsv)
            if isinstance(color, dict):
                if "hex" in color and color["hex"]:
                    hsv_values.append(hex_to_hsv(color["hex"]))
                elif "hsv" in color and len(color["hsv"]) == 3:
                    h_opencv, s, v = color["hsv"]
                    # Convert OpenCV HSV (0-180, 0-255, 0-255) to standard float tuple
                    hsv_values.append((h_opencv * 2.0, s / 255.0, v / 255.0))
            # Handle direct string hex values
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


def check_wardrobe_for_accessory(slot: str, db=None) -> dict | None:
    """Placeholder for wardrobe accessory lookups."""
    return None


def recommend_accessories(formality: str, garments: list[dict], season: str | None = None) -> list[dict]:
    accessory_types = ACCESSORY_TYPES.get(formality)
    if accessory_types is None:
        raise ValueError(f"Unknown formality level: {formality}")

    outfit_classification = classify_outfit_tone(garments)
    statement_tone = get_accessory_tone(outfit_classification)

    avg_brightness = get_average_brightness(garments)
    brightness_class = classify_outfit_brightness(avg_brightness)
    practical_tone_prefix = PRACTICAL_TONE_BY_BRIGHTNESS[brightness_class]

    results = []
    for slot, base_type in accessory_types.items():
        wardrobe_match = check_wardrobe_for_accessory(slot)

        if wardrobe_match:
            results.append({
                "slot": slot,
                "name": wardrobe_match["name"],
                "source": "wardrobe",
                "reason": f"You already own a compatible {slot} item",
                "confidence": 100,
            })
            continue

        # Footwear varies by season, if season is known
        if slot == "footwear" and season and season in FOOTWEAR_BY_SEASON.get(formality, {}):
            base_type = FOOTWEAR_BY_SEASON[formality][season]

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