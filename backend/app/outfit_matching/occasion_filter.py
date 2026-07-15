# narrow the wardrobe to items tagged for the selected occasion, before scoring
from typing import Any


def filter_by_occasion(wardrobe: list[dict[str, Any]], occasion: str) -> list[dict[str, Any]]:
    """Return only garments whose tags.occasion list contains `occasion`.

    Occasion is multi-label (e.g. an item can be tagged both "Office" and
    "Date"), so this is a membership check, not an equality check.
    """
    occasion = occasion.strip()
    filtered = [g for g in wardrobe if occasion in g["tags"]["occasion"]]
    return filtered


def group_by_category(garments: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    """Split a flat garment list into {category: [garments]} buckets.
    Ranker uses this to build category combinations (top+bottom, dress, etc).
    """
    buckets: dict[str, list[dict[str, Any]]] = {}
    for g in garments:
        buckets.setdefault(g["category"], []).append(g)
    return buckets