# fixed tag vocabularies used by the matcher

FORMALITY = ["Casual", "Smart Casual", "Formal"]
SEASON = ["Spring", "Summer", "Autumn", "Winter"]
PATTERN = ["Solid", "Striped", "Checked", "Graphic", "Floral"]
OCCASION = ["Casual", "Office", "Party", "Farewell"]

# garment categories used to build outfits
CATEGORIES = ["top", "bottom", "dress", "outerwear"]

# base outfit category templates
OUTFIT_TEMPLATES = [
    ["top", "bottom"],
    ["dress"],
]
OPTIONAL_CATEGORIES = ["outerwear"]

# embedding and metadata fusion settings
EMBEDDING_DIM = 512
METADATA_WEIGHT_ALPHA = 0.3  # metadata vector weight after l2 norm

# color harmony settings
HARMONY_RULES = {
    "monochromatic": {"center": 0, "tolerance": 15},
    "analogous": {"center": 45, "tolerance": 30},
    "triadic": {"center": 120, "tolerance": 25},
    "complementary": {"center": 180, "tolerance": 30},
}

# final ranking weights
W_COMPAT = 0.6
W_HARMONY = 0.4

DEFAULT_TOP_K = 10
