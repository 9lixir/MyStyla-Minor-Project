import numpy as np
from scipy.special import softmax
from app.classification.fashion_clip_model import embed_texts

# CATEGORY_LABELS = ["shirt", "t-shirt", "jacket", "dress", "jeans", "skirt", "sweater", "shorts"]
# FORMALITY_LABELS = ["casual", "formal", "business casual", "athletic"]
# SEASON_LABELS = ["summer", "winter", "spring", "autumn", "all-season"]
# PATTERN_LABELS = ["solid", "striped", "floral", "plaid", "polka dot", "graphic print"]
# OCCASION_LABELS = ["everyday wear", "party", "work", "workout", "formal event"]

# Mirror of frontend/src/lib/categories.js -- keep both in sync.

CATEGORY_LABELS = [
    # Tops
    "t-shirt", "shirt", "blouse", "tank top", "polo", "crop top", "tube top", "bodysuit",
    # Sweaters & Knits
    "sweater", "cardigan", "hoodie", "sweatshirt", "turtleneck",
    # Outerwear
    "jacket", "denim jacket", "leather jacket", "blazer", "coat", "parka", "windbreaker", "vest",
    # Bottoms
    "jeans", "trousers", "chinos", "cargo pants", "joggers", "leggings", "shorts",
    # Skirts
    "skirt", "mini skirt", "maxi skirt", "pleated skirt",
    # Dresses & Sets
    "dress", "jumpsuit", "romper", "co-ord set",
    # Formalwear
    "suit", "tuxedo", "gown",
    # Footwear
    "sneakers", "boots", "sandals", "heels", "flats", "loafers",
    # Accessories
    "belt", "hat", "scarf", "gloves", "tie", "bag", "sunglasses", "jewelry", "watch",
]

FORMALITY_LABELS = ["casual", "formal", "business casual", "athletic"]
SEASON_LABELS = ["summer", "winter", "spring", "autumn", "all-season"]
PATTERN_LABELS = ["solid", "striped", "floral", "plaid", "polka dot", "graphic print"]
OCCASION_LABELS = ["everyday wear", "party", "work", "workout", "formal event"]

#temperature matches fashionCLIP pretraining temperature, which is 0.07. This is used in the softmax function to scale the logits before computing probabilities.
GAMMA = 0.07
CONFIDENCE_THRESHOLD = 0.35

LABEL_LISTS = {
    "category": CATEGORY_LABELS,
    "formality": FORMALITY_LABELS,
    "season": SEASON_LABELS,
    "pattern": PATTERN_LABELS,
    "occasion": OCCASION_LABELS,
}

LABEL_EMBEDDINGS = None


def _get_label_embeddings():
    """cache label embeddings after first classification"""
    global LABEL_EMBEDDINGS
    if LABEL_EMBEDDINGS is None:
        LABEL_EMBEDDINGS = {field: embed_texts(labels) for field, labels in LABEL_LISTS.items()}
    return LABEL_EMBEDDINGS


def cosine_similarity(a, b):
    a, b = np.array(a), np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def softmax(scores,gamma=GAMMA):
    scores = np.array(scores) / gamma
    scores = scores - np.max(scores)  # For numerical stability
    exp_scores = np.exp(scores)
    return exp_scores / np.sum(exp_scores)

def tag_garment(image_embedding: list) -> dict:
    label_embeddings = _get_label_embeddings()
    tags = {}
    flags = {}
    for field, label_list in LABEL_LISTS.items():
<<<<<<< HEAD
        raw_scores = [cosine_similarity(image_embedding, le) for le in LABEL_EMBEDDINGS[field]]
        probs = softmax(raw_scores)
        best_idx = int(np.argmax(probs))
        confidence = float(probs[best_idx])

        tags[field] = label_list[best_idx]
        flags[field] = confidence < CONFIDENCE_THRESHOLD
    return tags, flags
=======
        scores = [cosine_similarity(image_embedding, le) for le in label_embeddings[field]]
        best_idx = int(np.argmax(scores))
        tags[field] = label_list[best_idx]
    return tags
>>>>>>> main
