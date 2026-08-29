# fixed tag vocabularies used by the matcher

FORMALITY = ["Casual", "Smart Casual", "Formal", "Athletic", "Festive"]
SEASON = ["Spring", "Summer", "Autumn", "Winter", "All-Season"]
PATTERN = ["Solid", "Striped", "Checked", "Graphic", "Floral"]

# Only these 8 are ever directly assigned by the classifier each one has
# a real visual signal (formality level, embellishment, south-asian cues).

# Everything else in OCCASION below is "query-only": a user can filter by
# it, but it's reached exclusively through OCCASION_CLUSTERS fallback,
# because a garment photo alone can't tell College apart from Shopping.

CLASSIFIER_OCCASIONS = [
    "everyday wear",
    "work",
    "party",
    "date",
    "formal event",
    "wedding",
    "puja",
    "festival",
]

OCCASION = CLASSIFIER_OCCASIONS + [
    "College", "Shopping", "Travel",
    "Meeting", "Interview", "Presentation",
    "Dinner", "Birthday",
    "Religious Ceremony",
    "Graduation",
]

# Cluster map used for occasion fallback matching — "similar occasions, similar dresses." 
# Add new occasions here and they inherit fallback behavior automatically, no engine code changes needed.
OCCASION_CLUSTERS = {
    # Everyday
    "everyday wear": "everyday",
    "Casual": "everyday",
    "College": "everyday",
    "Shopping": "everyday",
    "Travel": "everyday",

    # Work / professional
    "work": "formal_professional",
    "formal event": "formal_professional",
    "Office": "formal_professional",
    "Meeting": "formal_professional",
    "Interview": "formal_professional",
    "Presentation": "formal_professional",

    # Social / evening
    "party": "evening_social",
    "date": "evening_social",
    "Party": "evening_social",
    "Date": "evening_social",
    "Dinner": "evening_social",
    "Birthday": "evening_social",
    "Farewell": "evening_social",

    # Traditional / festive
    "wedding": "festive_traditional",
    "puja": "festive_traditional",
    "festival": "festive_traditional",
    "Wedding": "festive_traditional",
    "Puja": "festive_traditional",
    "Festival": "festive_traditional",
    "Religious Ceremony": "festive_traditional",

    # Milestone
    "Graduation": "milestone",
}

# garment categories used to build outfits
CATEGORIES = ["top", "bottom", "dress", "outerwear"]

OUTFIT_TEMPLATES = [
    ["top", "bottom"],
    ["dress"],
]

OPTIONAL_CATEGORIES = ["outerwear"]

EMBEDDING_DIM = 512
METADATA_WEIGHT_ALPHA = 0.3

HARMONY_RULES = {
    "monochromatic": {"center": 0, "tolerance": 15},
    "analogous": {"center": 45, "tolerance": 30},
    "triadic": {"center": 120, "tolerance": 25},
    "complementary": {"center": 180, "tolerance": 30},
}

# final ranking weights -- sum to 1.0
W_COMPAT = 0.6
W_HARMONY = 0.25
W_WEATHER = 0.15

DEFAULT_TOP_K = 10
# accessory categories - NOT used for building outfit templates, only for
# validating garment classification during upload (bag, footwear, etc.)
# Keep both the canonical matcher values and the generic aliases accepted by the
# UI so edited classifications remain valid across the whole scan/upload flow.
ACCESSORY_CATEGORIES = [
    "footwear", "accessories",
    "bag", "jewelry", "watch", "belt", "hat", "scarf", "gloves", "tie", "sunglasses",
]

# full set of valid categories for garment classification validation
ALL_CATEGORIES = CATEGORIES + ACCESSORY_CATEGORIES
