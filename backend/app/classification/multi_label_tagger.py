import logging
import numpy as np
from app.classification.fashion_clip_model import embed_texts, predict_indofashion

logger = logging.getLogger(__name__)

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
        "sneakers", "boots", "sandals", "heels", "flats", "loafers", "mojari",
    # Accessories
    "belt", "hat", "scarf", "gloves", "tie", "bag", "sunglasses", "jewelry", "watch",
    # South Asian
    "kurti", "kurta", "saree", "lehenga", "sherwani", "salwar suit", "anarkali", "dhoti",
    # Nepali
    "daura suruwal", "gunyu cholo", "haku patasi", "labeda suruwal", "dhaka topi",
]

SOUTH_ASIAN_SET = {"kurti", "kurta", "saree", "lehenga", "sherwani", "salwar suit", "anarkali", "dhoti"}

NEPALI_SET = {"daura suruwal", "gunyu cholo", "haku patasi", "labeda suruwal", "dhaka topi"}

# clip doesn't know these words, so the prompt is describing the garment as:
NEPALI_PROMPTS = {
    "daura suruwal": "a photo of a daura suruwal, traditional Nepali men's outfit with a closed-neck double-breasted wrap-around top and matching narrow trousers",
    "gunyu cholo":   "a photo of a gunyu cholo, traditional Nepali women's outfit with a fitted blouse and a wrapped sari skirt",
    "haku patasi":   "a photo of a haku patasi, traditional Newari attire, a fitted cropped blouse and black sari with a deep red border",
    "labeda suruwal":"a photo of a labeda suruwal, traditional Nepali long kurta-style tunic with loose trousers",
    "dhaka topi":    "a photo of a dhaka topi, a traditional Nepali patterned brimless cap worn by men",
}

FORMALITY_LABELS = ["casual", "formal", "business casual", "athletic"]
SEASON_LABELS = ["summer", "winter", "spring", "autumn", "all-season"]
PATTERN_LABELS = ["solid", "striped", "floral", "plaid", "polka dot", "graphic print"]
OCCASION_LABELS = ["everyday wear", "party", "work", "workout", "formal event"]

# Per-field abstention thresholds. A 55-way choice needs a higher bar than a
# 4-way one. THESE ARE STARTING GUESSES -- tune them against labelled examples.
CONFIDENCE_THRESHOLDS = {
    "category": 0.55,
    "formality": 0.45,
    "season": 0.45,
    "pattern": 0.45,
    "occasion": 0.45,
}

# Also flag when the top two labels are close, even if the winner clears the
# threshold. With logit_scale ~100 the softmax saturates, so absolute probability
# alone misses genuine ties (0.44 vs 0.41 is a coin flip that looks confident).
MARGIN_THRESHOLDS = {
    "category": 0.20,
    "formality": 0.15,
    "season": 0.15,
    "pattern": 0.15,
    "occasion": 0.15,
}

SOUTH_ASIAN_ROUTER_THRESHOLD = 0.30

LABEL_LISTS = {
    "category": CATEGORY_LABELS,
    "formality": FORMALITY_LABELS,
    "season": SEASON_LABELS,
    "pattern": PATTERN_LABELS,
    "occasion": OCCASION_LABELS,
}

INDOFASHION_TO_CATEGORY = {
    "women_kurta": "kurti",      "kurta_men": "kurta",
    "saree": "saree",            "lehenga": "lehenga",
    "sherwanis": "sherwani",     "dhoti_pants": "dhoti",
    "leggings_and_salwars": "salwar suit",
    "palazzos": "trousers",      "dupattas": "scarf",
    "blouse": "blouse",          "gowns": "gown",
    "petticoats": "skirt",       "nehru_jackets": "vest",
    "mojaris_men": "mojari",     "mojaris_women": "mojari",
}

LABEL_EMBEDDINGS = None


def _get_label_embeddings():
    global LABEL_EMBEDDINGS
    if LABEL_EMBEDDINGS is None:
        LABEL_EMBEDDINGS = {}

        def _category_prompt(cat):
            if cat in NEPALI_PROMPTS:
                return NEPALI_PROMPTS[cat]
            if cat in SOUTH_ASIAN_SET:
                return f"a photo of traditional South Asian {cat}"
            return f"a photo of a {cat}"

        category_prompts = [_category_prompt(cat) for cat in CATEGORY_LABELS]
        LABEL_EMBEDDINGS["category"] = embed_texts(category_prompts)   # <-- the line that was likely missing

        for field, labels in LABEL_LISTS.items():
            if field == "category":
                continue
            prompts = [f"a photo of clothing with {lbl} style" for lbl in labels]
            LABEL_EMBEDDINGS[field] = embed_texts(prompts)
    return LABEL_EMBEDDINGS


def cosine_similarity(a, b):
    a, b = np.array(a), np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def softmax(scores):
    from app.classification.fashion_clip_model import _load_model
    model, _ = _load_model()
    scale = model.logit_scale.exp().item()   # ~100 for fashion-clip
    scores = np.array(scores) * scale
    scores = scores - np.max(scores)
    exp_scores = np.exp(scores)
    return exp_scores / np.sum(exp_scores)


def _uncertainty(probs, field):
    """Return (is_flagged, top1, top2, reason) for one field's probability vector."""
    ordered = np.sort(np.asarray(probs))[::-1]
    top1 = float(ordered[0])
    top2 = float(ordered[1]) if ordered.size > 1 else 0.0
    margin = top1 - top2

    low_prob = top1 < CONFIDENCE_THRESHOLDS.get(field, 0.45)
    tight = margin < MARGIN_THRESHOLDS.get(field, 0.15)

    reason = "low_prob" if low_prob else ("tight_margin" if tight else "confident")
    return (low_prob or tight), top1, top2, reason


def tag_garment(image_embedding: list, image=None) -> dict:
    label_embeddings = _get_label_embeddings()
    tags = {}
    flags = {}

    # ---- Stage 1: open-set router (zero-shot CLIP across all 55 categories) ----
    cat_scores = [cosine_similarity(image_embedding, le) for le in label_embeddings["category"]]
    cat_probs = softmax(cat_scores)
    best_idx = int(np.argmax(cat_probs))

    clip_category = CATEGORY_LABELS[best_idx]
    clip_flagged, top1, top2, reason = _uncertainty(cat_probs, "category")

    south_asian_mass = float(sum(
        cat_probs[i] for i, lbl in enumerate(CATEGORY_LABELS) if lbl in SOUTH_ASIAN_SET
    ))

    tags["category"] = clip_category
    flags["category"] = clip_flagged

    logger.info(
        "router: clip=%s p1=%.3f p2=%.3f sa_mass=%.3f flag=%s (%s)",
        clip_category, top1, top2, south_asian_mass, clip_flagged, reason,
    )

    # ---- Stage 2: specialist head, only for garments the router calls traditional ----
    looks_south_asian = (
        clip_category in SOUTH_ASIAN_SET
        or south_asian_mass >= SOUTH_ASIAN_ROUTER_THRESHOLD
    )

    if image is not None and looks_south_asian:
        try:
            res = predict_indofashion(image)
            mapped = INDOFASHION_TO_CATEGORY.get(res["prediction"])
            head_low_conf = bool(res["flagged_low_confidence"])

            if mapped and not head_low_conf:
                disagrees = mapped != clip_category
                tags["category"] = mapped
                # Two independent models reaching different answers is the
                # strongest uncertainty signal available -- surface it.
                flags["category"] = disagrees
                logger.info(
                    "head: pred=%s mapped=%s conf=%s -> used; clip said %s; flag=%s",
                    res["prediction"], mapped, res["confidence"], clip_category, disagrees,
                )
            else:
                logger.info(
                    "head: pred=%s conf=%s low_conf=%s -> abstained, keeping clip=%s",
                    res["prediction"], res["confidence"], head_low_conf, clip_category,
                )
        except Exception as e:
            logger.warning("indofashion failed: %s", e)
    elif image is not None:
        logger.info("router: not traditional wear -- head skipped")

    # ---- Remaining metadata via zero-shot CLIP ----
    for field, label_list in LABEL_LISTS.items():
        if field == "category":
            continue
        scores = [cosine_similarity(image_embedding, le) for le in label_embeddings[field]]
        probs = softmax(scores)
        idx = int(np.argmax(probs))
        tags[field] = label_list[idx]

        flagged, f_top1, f_top2, f_reason = _uncertainty(probs, field)
        flags[field] = flagged
        logger.info(
            "%s=%s p1=%.3f p2=%.3f flag=%s (%s)",
            field, tags[field], f_top1, f_top2, flagged, f_reason,
        )

    return {"tags": tags, "flags": flags}