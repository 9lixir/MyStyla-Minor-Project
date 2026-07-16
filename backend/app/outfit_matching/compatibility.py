# visual and metadata compatibility scoring

import math
from typing import Any

from app.outfit_matching.config import FORMALITY, SEASON, PATTERN, OCCASION, METADATA_WEIGHT_ALPHA


def _l2_normalize(vec: list[float]) -> list[float]:
    norm = math.sqrt(sum(x * x for x in vec))
    if norm == 0:
        return vec
    return [x / norm for x in vec]


def _metadata_vector(tags: dict[str, Any]) -> list[float]:
    """build the fixed order metadata vector"""
    vec = []
    vec += [1.0 if tags["formality"] == f else 0.0 for f in FORMALITY]
    vec += [1.0 if tags["season"] == s else 0.0 for s in SEASON]
    vec += [1.0 if tags["pattern"] == p else 0.0 for p in PATTERN]
    vec += [1.0 if o in tags["occasion"] else 0.0 for o in OCCASION]
    return vec


def build_combined_vector(garment: dict[str, Any], alpha: float = METADATA_WEIGHT_ALPHA) -> list[float]:
    """build the fused visual and metadata vector"""
    visual = _l2_normalize(garment["embedding"])
    metadata = _l2_normalize(_metadata_vector(garment["tags"]))
    metadata_scaled = [alpha * x for x in metadata]
    return visual + metadata_scaled


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def score_garment_pair(garment_a: dict[str, Any], garment_b: dict[str, Any]) -> float:
    vec_a = build_combined_vector(garment_a)
    vec_b = build_combined_vector(garment_b)
    similarity = cosine_similarity(vec_a, vec_b)
    return round(similarity, 3)


def score_outfit_compatibility(garments: list[dict[str, Any]]) -> float:
    """average pairwise compatibility for an outfit"""
    if len(garments) < 2:
        return 1.0

    pair_scores = []
    for i in range(len(garments)):
        for j in range(i + 1, len(garments)):
            pair_scores.append(score_garment_pair(garments[i], garments[j]))

    return round(sum(pair_scores) / len(pair_scores), 3)
