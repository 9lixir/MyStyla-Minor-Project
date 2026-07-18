import numpy as np
from app.classification.fashion_clip_model import embed_texts

CATEGORY_LABELS = ["shirt", "t-shirt", "jacket", "dress", "jeans", "skirt", "sweater", "shorts"]
FORMALITY_LABELS = ["casual", "formal", "business casual", "athletic"]
SEASON_LABELS = ["summer", "winter", "spring", "autumn", "all-season"]
PATTERN_LABELS = ["solid", "striped", "floral", "plaid", "polka dot", "graphic print"]
OCCASION_LABELS = ["everyday wear", "party", "work", "workout", "formal event"]

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


def tag_garment(image_embedding: list) -> dict:
    label_embeddings = _get_label_embeddings()
    tags = {}
    for field, label_list in LABEL_LISTS.items():
        scores = [cosine_similarity(image_embedding, le) for le in label_embeddings[field]]
        best_idx = int(np.argmax(scores))
        tags[field] = label_list[best_idx]
    return tags
