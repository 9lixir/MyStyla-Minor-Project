import numpy as np
from scipy.special import softmax
from app.classification.fashion_clip_model import embed_texts

CATEGORY_LABELS = ["shirt", "t-shirt", "jacket", "dress", "jeans", "skirt", "sweater", "shorts"]
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

# Computed ONCE when the server starts, not per-upload
LABEL_EMBEDDINGS = {field: embed_texts(labels) for field, labels in LABEL_LISTS.items()}


def cosine_similarity(a, b):
    a, b = np.array(a), np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def softmax(scores,gamma=GAMMA):
    scores = np.array(scores) / gamma
    scores = scores - np.max(scores)  # For numerical stability
    exp_scores = np.exp(scores)
    return exp_scores / np.sum(exp_scores)

def tag_garment(image_embedding: list) -> dict:
    tags = {}
    flags = {}
    for field, label_list in LABEL_LISTS.items():
        raw_scores = [cosine_similarity(image_embedding, le) for le in LABEL_EMBEDDINGS[field]]
        probs = softmax(raw_scores)
        best_idx = int(np.argmax(probs))
        confidence = float(probs[best_idx])

        tags[field] = label_list[best_idx]
        flags[field] = confidence < CONFIDENCE_THRESHOLD
    return tags, flags