# ---- Fixed tag vocabularies (must match Table 3.1 / the classifier's output) ----
#tunable value and fixed vocabularies for the metadata vector (formality, season, pattern, occasion) used in the Layer 2 compatibility scoring

FORMALITY = ["Casual", "Smart Casual", "Formal"]
SEASON = ["Spring", "Summer", "Autumn", "Winter"]
PATTERN = ["Solid", "Striped", "Checked", "Graphic", "Floral"]
OCCASION = ["Casual", "Office", "Party", "Date", "Farewell"]

# Garment categories the matching engine assembles into outfits.

CATEGORIES = ["top", "bottom", "dress", "outerwear"]

# Valid "outfit templates" - which category combinations count as a complete
# base outfit. Outerwear is always optional (appended if it scores well).
OUTFIT_TEMPLATES = [
    ["top", "bottom"],
    ["dress"],
]
OPTIONAL_CATEGORIES = ["outerwear"]

# ---- Embedding / metadata fusion (Layer 2) ----
EMBEDDING_DIM = 512
METADATA_WEIGHT_ALPHA = 0.3  # weight applied to the metadata vector after L2 norm

# ---- Color harmony (Layer 1) ----
# Ideal hue separations in degrees, and how forgiving each rule is.
HARMONY_RULES = {
    "monochromatic": {"center": 0, "tolerance": 15},
    "analogous": {"center": 45, "tolerance": 30},
    "triadic": {"center": 120, "tolerance": 25},
    "complementary": {"center": 180, "tolerance": 30},
}

# ---- Ranking weights: final_score = W_COMPAT * compat_score + W_HARMONY * harmony_score ----
W_COMPAT = 0.6
W_HARMONY = 0.4

DEFAULT_TOP_K = 10