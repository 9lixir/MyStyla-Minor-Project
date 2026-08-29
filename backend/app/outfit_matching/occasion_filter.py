from typing import Any
from app.outfit_matching.config import OCCASION_CLUSTERS


def _garments_matching(wardrobe: list[dict[str, Any]], allowed: set[str]) -> list[dict[str, Any]]:
    matched = []
    allowed = {str(value).strip().lower() for value in allowed}
    for g in wardrobe:
        occ = g.get("tags", {}).get("occasion", [])
        if isinstance(occ, str):
            occ = [occ]

        normalized_occ = {
            str(o).strip().lower()
            for o in occ
            if o is not None
        }

        if normalized_occ & allowed:
            matched.append(g)

    return matched


def filter_by_occasion(wardrobe: list[dict[str, Any]], occasion: str) -> list[dict[str, Any]]:
    """exact occasion match first; fall back to same-cluster occasions if
    nothing exact is found -- this is what lets 'Interview' or 'College'
    return real garments even though nothing is ever tagged that literally."""
    target = str(occasion or "").strip().lower()

    if not target:
        return wardrobe

    # exact occasion match
    exact = _garments_matching(wardrobe, {target})
    if exact:
        return exact

    #case-insensitive cluster match

    cluster = next(
        (
            cluster_name
            for name, cluster_name in OCCASION_CLUSTERS.items()
            if name.lower() == target
        ),
        None,
    )

    if not cluster:
        return [] 

    sibling_occasions = 
    {name.lower() 
     for name, cluster_name in OCCASION_CLUSTERS.items() 
     if cluster_name == cluster}
    
    return _garments_matching(wardrobe, sibling_occasions)


def group_by_category(garments: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    buckets: dict[str, list[dict[str, Any]]] = {}
    for g in garments:
        buckets.setdefault(g["category"], []).append(g)
    return buckets