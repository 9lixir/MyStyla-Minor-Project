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
    },
    "Formal": {
        "bag": "Structured Handbag",
        "footwear": "Oxford Shoes",
        "jewelry": "Statement Jewelry",
        "watch": "Elegant Watch",
    },
}

# Category-aware color maps to prevent monochromatic accessory bloat
LEATHER_TONES = {
    "warm": "Brown",
    "cool": "Black",
    "neutral": "Brown",
    "accent": "Tan",
}

JEWELRY_TONES = {
    "warm": "Gold",
    "cool": "Silver",
    "neutral": "Emerald",
    "accent": "Emerald",
}

NEUTRAL_SATURATION_THRESHOLD = 0.20
MULTICOLOR_SPREAD_THRESHOLD = 0.5


# --- Color & Circular Math Utilities ---

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


def check_wardrobe_for_accessory(slot: str, db=None) -> dict | None:
    """Placeholder for wardrobe accessory lookups."""
    return None


# --- Recommendation Entrypoint ---

def recommend_accessories(formality: str, garments: list[dict]) -> list[dict]:
    """Generate accessory recommendations with category-aware color mapping."""
    formality_map = {
        "casual": "Casual",
        "smart casual": "Smart Casual",
        "business casual": "Smart Casual",
        "formal": "Formal",
    }
    norm_formality = formality_map.get(str(formality).lower(), "Casual")
    accessory_types = ACCESSORY_TYPES[norm_formality]

    outfit_classification = classify_outfit_tone(garments)
    tone = get_accessory_tone(outfit_classification)

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
        else:
            # Pick category-aware prefixes so shoes/bags and jewelry/watches get distinct colors
            if slot in ["bag", "footwear"]:
                prefix = LEATHER_TONES.get(tone, "Brown")
            else:
                prefix = JEWELRY_TONES.get(tone, "Emerald")

            results.append({
                "slot": slot,
                "name": f"{prefix} {base_type}",
                "source": "catalog",
                "reason": f"Outfit is {outfit_classification} - a {tone}-toned {slot} complements it",
                "confidence": 75,
            })

    return results