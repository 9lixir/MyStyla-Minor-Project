"""
dummy_data.py
Generates a fake wardrobe that matches the exact schema in models.py.
THE SWAP POINT: Replace get_wardrobe() to query Postgres+Qdrant when ready.
"""

import random
import numpy as np
import cv2


def _random_embedding(dim: int = 512) -> list:
    """Temporary: random unit vector. Replace with real Qdrant fetch later."""
    vec = [random.gauss(0, 1) for _ in range(dim)]
    mag = sum(x**2 for x in vec) ** 0.5
    return [x / mag for x in vec]


def _color(r, g, b) -> dict:
    """Helper to build a color entry matching color_extract.extract_colors() output."""
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
    """
    Returns a list of garment dicts for the given user.

    When Postgres + Qdrant are ready, replace this with real data fetch.
    """
    return DUMMY_WARDROBE
