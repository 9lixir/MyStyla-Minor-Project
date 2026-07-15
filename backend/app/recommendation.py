"""
Rule-based Accessory Recommendation Engine
--------------------------------------------
Implements a* = R(f, h_bar) using Table 3.2.

Inputs: formality f in {Casual, Smart Casual, Formal}, and the outfit's HSV
color profile (computed from garment dominant_colors).

Color-harmony rule (3-way, matches the outfit engine's HSV logic):
  - warm-dominant outfit      -> cool-toned accessory
  - cool-dominant outfit      -> warm-toned accessory
  - multicolored/patterned    -> neutral-toned accessory   (high hue spread)
  - neutral outfit (low sat)  -> accent-colored accessory  (low saturation)

Before suggesting a generic catalog accessory, the engine checks whether the
user already owns a compatible accessory in their scanned wardrobe.
"""

import colorsys
import math

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

TONE_PREFIX = {
    "warm": "Gold",
    "cool": "Silver",
    "neutral": "Black",
    "accent": "Emerald",
}


def hex_to_hsv(hex_color: str) -> tuple[float, float, float]:
    """Converts hex (e.g. '#a13f2c') to (hue in degrees, saturation, value)."""
    hex_color = hex_color.lstrip("#")
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    return h * 360.0, s, v


def collect_hsv(garments: list[dict]) -> list[tuple[float, float, float]]:
    hsv_values = []
    for garment in garments:
        for color in garment.get("dominant_colors", []):
            hex_value = color.get("hex") if isinstance(color, dict) else color
            if hex_value:
                hsv_values.append(hex_to_hsv(hex_value))
    return hsv_values


def circular_mean_and_spread(hues: list[float]) -> tuple[float, float]:
    """
    Returns (mean_hue_degrees, resultant_length).
    resultant_length near 1 = hues tightly clustered; near 0 = spread out
    (multicolored/patterned).
    """
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


NEUTRAL_SATURATION_THRESHOLD = 0.20
MULTICOLOR_SPREAD_THRESHOLD = 0.5


def classify_outfit_tone(garments: list[dict]) -> str:
    """Returns "warm-dominant", "cool-dominant", "multicolored", or "neutral"."""
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
    return {
        "warm-dominant": "cool",
        "cool-dominant": "warm",
        "multicolored": "neutral",
        "neutral": "accent",
    }[outfit_classification]


def check_wardrobe_for_accessory(slot: str, db=None) -> dict | None:
    """
    STUB - depends on the Garment model's `category` field, which doesn't
    exist yet (Ayushma/Muskan's pipeline). Once it does:
        match = db.query(Garment).filter(Garment.category == slot).first()
        return {"name": match.filename, "source": "wardrobe"} if match else None
    """
    return None


def recommend_accessories(formality: str, garments: list[dict]) -> list[dict]:
    accessory_types = ACCESSORY_TYPES.get(formality)
    if accessory_types is None:
        raise ValueError(f"Unknown formality level: {formality}")

    outfit_classification = classify_outfit_tone(garments)
    tone = get_accessory_tone(outfit_classification)
    tone_prefix = TONE_PREFIX[tone]

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
            results.append({
                "slot": slot,
                "name": f"{tone_prefix} {base_type}",
                "source": "catalog",
                "reason": f"Outfit is {outfit_classification} - a {tone}-toned {slot} complements it",
                "confidence": 75,
            })

    return results