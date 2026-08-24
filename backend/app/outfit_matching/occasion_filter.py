from typing import Any
from app.outfit_matching.config import OCCASION_CLUSTERS


def _garments_matching(wardrobe: list[dict[str, Any]], allowed: set[str]) -> list[dict[str, Any]]:
    matched = []
    for g in wardrobe:
        occ = g.get("tags", {}).get("occasion", [])
        if isinstance(occ, str):
            occ = [occ]
        if any(str(o).lower() in allowed for o in occ):
            matched.append(g)
    return matched


def filter_by_occasion(wardrobe: list[dict[str, Any]], occasion: str) -> list[dict[str, Any]]:
    """exact occasion match first; fall back to same-cluster occasions if
    nothing exact is found -- this is what lets 'Interview' or 'College'
    return real garments even though nothing is ever tagged that literally."""
    target = occasion.strip()

    exact = _garments_matching(wardrobe, {target.lower()})
    if exact:
        return exact

    cluster = OCCASION_CLUSTERS.get(target)
    if not cluster:
        return exact  # unknown occasion, nothing to fall back to

    sibling_occasions = {name.lower() for name, c in OCCASION_CLUSTERS.items() if c == cluster}
    return _garments_matching(wardrobe, sibling_occasions)


def group_by_category(garments: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    buckets: dict[str, list[dict[str, Any]]] = {}
    for g in garments:
        buckets.setdefault(g["category"], []).append(g)
    return buckets