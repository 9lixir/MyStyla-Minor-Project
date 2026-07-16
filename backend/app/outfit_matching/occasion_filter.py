# narrow wardrobe by selected occasion
from typing import Any


def filter_by_occasion(wardrobe: list[dict[str, Any]], occasion: str) -> list[dict[str, Any]]:
    """return garments tagged for the selected occasion"""
    occasion = occasion.strip()
    filtered = [g for g in wardrobe if occasion in g["tags"]["occasion"]]
    return filtered


def group_by_category(garments: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    """group garments by category"""
    buckets: dict[str, list[dict[str, Any]]] = {}
    for g in garments:
        buckets.setdefault(g["category"], []).append(g)
    return buckets
