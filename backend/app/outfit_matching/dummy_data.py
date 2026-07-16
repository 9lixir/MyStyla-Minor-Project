import random
import numpy as np
import cv2

from app.database import SessionLocal
from app.models import Garment, GarmentClassification
from app.scanning.vector_store import client, COLLECTION_NAME


def _random_embedding(dim: int = 512) -> list:
    """fallback random unit vector"""
    vec = [random.gauss(0, 1) for _ in range(dim)]
    mag = sum(x**2 for x in vec) ** 0.5
    return [x / mag for x in vec]


def _color(r, g, b) -> dict:
    """build a color entry in extract_colors format"""
    bgr = np.array([[[b, g, r]]], dtype=np.uint8)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)[0][0]
    return {
        "rgb": [r, g, b],
        "hsv": [int(hsv[0]), int(hsv[1]), int(hsv[2])],
        "hex": f"#{r:02x}{g:02x}{b:02x}",
    }


DUMMY_WARDROBE = [
    {
        "id": "garment-001",
        "category": "top",
        "colors": [_color(255, 255, 255), _color(220, 220, 220)],
        "tags": {
            "formality": "Casual",
            "season": "Summer",
            "pattern": "Solid",
            "occasion": ["Casual", "Office"],
        },
        "embedding": _random_embedding(),
    },
    {
        "id": "garment-002",
        "category": "top",
        "colors": [_color(10, 30, 90), _color(20, 50, 120)],
        "tags": {
            "formality": "Formal",
            "season": "Winter",
            "pattern": "Solid",
            "occasion": ["Office", "Party"],
        },
        "embedding": _random_embedding(),
    },
    {
        "id": "garment-003",
        "category": "bottom",
        "colors": [_color(70, 100, 160), _color(50, 80, 140)],
        "tags": {
            "formality": "Casual",
            "season": "Spring",
            "pattern": "Solid",
            "occasion": ["Casual", "Office", "Date"],
        },
        "embedding": _random_embedding(),
    },
    {
        "id": "garment-004",
        "category": "bottom",
        "colors": [_color(20, 20, 20), _color(40, 40, 40)],
        "tags": {
            "formality": "Formal",
            "season": "Autumn",
            "pattern": "Solid",
            "occasion": ["Office", "Party", "Date"],
        },
        "embedding": _random_embedding(),
    },
    {
        "id": "garment-005",
        "category": "outerwear",
        "colors": [_color(130, 130, 130), _color(100, 100, 100)],
        "tags": {
            "formality": "Smart Casual",
            "season": "Winter",
            "pattern": "Solid",
            "occasion": ["Casual", "Office"],
        },
        "embedding": _random_embedding(),
    },
    {
        "id": "garment-006",
        "category": "dress",
        "colors": [_color(240, 180, 200), _color(255, 200, 210)],
        "tags": {
            "formality": "Formal",
            "season": "Summer",
            "pattern": "Floral",
            "occasion": ["Party", "Date"],
        },
        "embedding": _random_embedding(),
    },
]


def get_wardrobe(user_id: str = None) -> list[dict]:
    """load wardrobe rows from sqlite and qdrant"""
    db = SessionLocal()
    try:
        garments = db.query(Garment).all()
        classifications = db.query(GarmentClassification).all()
    finally:
        db.close()

    if user_id:
        classifications_for_user = [c for c in classifications if c.user_id == user_id]
        if classifications_for_user:
            classifications = classifications_for_user
            classified_ids = {c.garment_id for c in classifications_for_user}
            garments = [g for g in garments if g.id in classified_ids]

    classification_by_id = {c.garment_id: c for c in classifications}
    qdrant_ids = [g.qdrant_id for g in garments if g.qdrant_id]

    vectors_by_id: dict[str, list[float]] = {}
    if qdrant_ids:
        try:
            points = client.retrieve(
                collection_name=COLLECTION_NAME,
                ids=qdrant_ids,
                with_vectors=True,
                with_payload=False,
            )
            vectors_by_id = {str(point.id): point.vector for point in points if point.vector}
        except Exception:
            vectors_by_id = {}

    wardrobe: list[dict] = []
    for garment in garments:
        classification = classification_by_id.get(garment.id)
        if classification is None:
            continue

        embedding = vectors_by_id.get(garment.qdrant_id or "")
        if not embedding:
            embedding = _random_embedding()

        wardrobe.append(
            {
                "id": garment.id,
                "category": classification.category,
                "colors": garment.dominant_colors,
                "tags": {
                    "formality": classification.formality,
                    "season": classification.season,
                    "pattern": classification.pattern,
                    "occasion": classification.occasion,
                },
                "embedding": embedding,
            }
        )

    if wardrobe:
        return wardrobe

    return DUMMY_WARDROBE
