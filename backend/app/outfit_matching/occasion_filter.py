from typing import Any


def filter_by_occasion(wardrobe: list[dict[str, Any]], occasion: str) -> list[dict[str, Any]]:
    """return garments tagged for the selected occasion safely"""
    target = occasion.strip().lower()
    filtered = []
    
    for g in wardrobe:
        occ = g.get("tags", {}).get("occasion", [])
        # Support both string and list representations
        if isinstance(occ, str):
            occ = [occ]
        if any(target == str(o).lower() for o in occ):
            filtered.append(g)
            
    return filtered


def group_by_category(garments: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    """group garments by category"""
    buckets: dict[str, list[dict[str, Any]]] = {}
    for g in garments:
        buckets.setdefault(g["category"], []).append(g)
    return buckets