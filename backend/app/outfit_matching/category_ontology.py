from typing import Any


UNKNOWN_PROFILE = {
    "role": "unknown",
    "style_family": "western",
    "is_full_body": False,
}


CATEGORY_ONTOLOGY: dict[str, dict[str, Any]] = {
    # Tops
    "t-shirt": {"role": "upper", "sub_role": "base_top", "style_family": "western"},
    "shirt": {"role": "upper", "sub_role": "base_top", "style_family": "western"},
    "blouse": {"role": "upper", "sub_role": "base_top", "style_family": "western"},
    "tank top": {"role": "upper", "sub_role": "base_top", "style_family": "western"},
    "polo": {"role": "upper", "sub_role": "base_top", "style_family": "western"},
    "crop top": {"role": "upper", "sub_role": "base_top", "style_family": "western"},
    "tube top": {"role": "upper", "sub_role": "base_top", "style_family": "western"},
    "bodysuit": {"role": "upper", "sub_role": "base_top", "style_family": "western"},
    "turtleneck": {"role": "upper", "sub_role": "base_top", "style_family": "western"},

    # Knits and outer layers
    "sweater": {"role": "upper", "sub_role": "knit_top", "style_family": "western"},
    "hoodie": {"role": "upper", "sub_role": "casual_layer", "style_family": "western"},
    "sweatshirt": {"role": "upper", "sub_role": "casual_layer", "style_family": "western"},
    "cardigan": {"role": "layering", "sub_role": "light_outer_layer", "style_family": "western"},
    "jacket": {"role": "layering", "sub_role": "outer_layer", "style_family": "western"},
    "denim jacket": {"role": "layering", "sub_role": "outer_layer", "style_family": "western"},
    "leather jacket": {"role": "layering", "sub_role": "outer_layer", "style_family": "western"},
    "blazer": {"role": "layering", "sub_role": "formal_layer", "style_family": "western"},
    "coat": {"role": "layering", "sub_role": "heavy_outer_layer", "style_family": "western"},
    "parka": {"role": "layering", "sub_role": "heavy_outer_layer", "style_family": "western"},
    "windbreaker": {"role": "layering", "sub_role": "outer_layer", "style_family": "western"},
    "vest": {"role": "layering", "sub_role": "outer_layer", "style_family": "western"},

    # Bottoms
    "jeans": {"role": "lower", "sub_role": "denim", "style_family": "western"},
    "trousers": {"role": "lower", "sub_role": "pants", "style_family": "western"},
    "chinos": {"role": "lower", "sub_role": "pants", "style_family": "western"},
    "cargo pants": {"role": "lower", "sub_role": "utility_pants", "style_family": "western"},
    "joggers": {"role": "lower", "sub_role": "athletic_pants", "style_family": "western"},
    "leggings": {"role": "lower", "sub_role": "fitted_pants", "style_family": "hybrid"},
    "shorts": {"role": "lower", "sub_role": "shorts", "style_family": "western"},
    "skirt": {"role": "lower", "sub_role": "skirt", "style_family": "western"},
    "mini skirt": {"role": "lower", "sub_role": "short_skirt", "style_family": "western"},
    "maxi skirt": {"role": "lower", "sub_role": "long_skirt", "style_family": "western"},
    "pleated skirt": {"role": "lower", "sub_role": "skirt", "style_family": "western"},

    # Western one-piece garments
    "dress": {"role": "one_piece", "sub_role": "dress", "style_family": "western", "is_full_body": True},
    "jumpsuit": {"role": "one_piece", "sub_role": "jumpsuit", "style_family": "western", "is_full_body": True},
    "romper": {"role": "one_piece", "sub_role": "romper", "style_family": "western", "is_full_body": True},
    "co-ord set": {"role": "set", "sub_role": "co_ord", "style_family": "western", "is_full_body": True},
    "suit": {"role": "set", "sub_role": "suit", "style_family": "western", "is_full_body": True},
    "tuxedo": {"role": "set", "sub_role": "tuxedo", "style_family": "western", "is_full_body": True},
    "gown": {"role": "one_piece", "sub_role": "gown", "style_family": "western", "is_full_body": True},

    # South Asian garments
    "kurti": {"role": "south_asian_upper", "sub_role": "kurti", "style_family": "south_asian"},
    "women kurta": {"role": "south_asian_upper", "sub_role": "kurti", "style_family": "south_asian"},
    "kurta": {"role": "south_asian_upper", "sub_role": "kurta", "style_family": "south_asian"},
    "men kurta": {"role": "south_asian_upper", "sub_role": "kurta", "style_family": "south_asian"},
    "kurta men": {"role": "south_asian_upper", "sub_role": "kurta", "style_family": "south_asian"},
    "saree": {"role": "south_asian_one_piece", "sub_role": "saree", "style_family": "south_asian", "is_full_body": True},
    "lehenga": {"role": "south_asian_set", "sub_role": "lehenga", "style_family": "south_asian", "is_full_body": True},
    "sherwani": {"role": "south_asian_set", "sub_role": "sherwani", "style_family": "south_asian", "is_full_body": True},
    "sherwanis": {"role": "south_asian_set", "sub_role": "sherwani", "style_family": "south_asian", "is_full_body": True},
    "salwar suit": {"role": "south_asian_set", "sub_role": "salwar_suit", "style_family": "south_asian", "is_full_body": True},
    "anarkali": {"role": "south_asian_one_piece", "sub_role": "anarkali", "style_family": "south_asian", "is_full_body": True},
    "dhoti": {"role": "south_asian_lower", "sub_role": "ethnic_bottom", "style_family": "south_asian"},
    "dhoti pants": {"role": "south_asian_lower", "sub_role": "ethnic_bottom", "style_family": "south_asian"},
    "palazzo": {"role": "south_asian_lower", "sub_role": "wide_leg_bottom", "style_family": "south_asian"},
    "palazzos": {"role": "south_asian_lower", "sub_role": "wide_leg_bottom", "style_family": "south_asian"},
    "dupatta": {"role": "accessory", "sub_role": "dupatta", "style_family": "south_asian"},
    "scarf": {"role": "accessory", "sub_role": "scarf", "style_family": "hybrid"},
}


def normalize_fine_category(value: Any) -> str:
    return str(value or "").strip().lower().replace("_", " ")


def get_category_profile(fine_category: Any, broad_category: Any = None) -> dict[str, Any]:
    fine = normalize_fine_category(fine_category)
    profile = CATEGORY_ONTOLOGY.get(fine)
    if profile:
        return {**UNKNOWN_PROFILE, **profile}

    broad = normalize_fine_category(broad_category)
    broad_defaults = {
        "top": {"role": "upper"},
        "bottom": {"role": "lower"},
        "dress": {"role": "one_piece", "is_full_body": True},
        "outerwear": {"role": "layering"},
    }
    return {**UNKNOWN_PROFILE, **broad_defaults.get(broad, {})}


def enrich_matcher_tags(tags: dict[str, Any]) -> dict[str, Any]:
    enriched = dict(tags)
    fine_category = normalize_fine_category(
        enriched.get("fine_category") or enriched.get("category")
    )
    profile = get_category_profile(fine_category, enriched.get("category"))
    enriched["fine_category"] = fine_category
    enriched["role"] = profile["role"]
    enriched["style_family"] = profile["style_family"]
    enriched["is_full_body"] = profile["is_full_body"]
    return enriched


def structural_compatibility_multiplier(
    garment_a: dict[str, Any],
    garment_b: dict[str, Any],
) -> float:
    tags_a = garment_a.get("tags", {})
    tags_b = garment_b.get("tags", {})
    fine_a = normalize_fine_category(tags_a.get("fine_category") or garment_a.get("category"))
    fine_b = normalize_fine_category(tags_b.get("fine_category") or garment_b.get("category"))
    profile_a = get_category_profile(fine_a, garment_a.get("category"))
    profile_b = get_category_profile(fine_b, garment_b.get("category"))
    role_a = profile_a["role"]
    role_b = profile_b["role"]

    if profile_a["is_full_body"] and role_b in {"upper", "lower", "south_asian_upper", "south_asian_lower"}:
        return 0.0
    if profile_b["is_full_body"] and role_a in {"upper", "lower", "south_asian_upper", "south_asian_lower"}:
        return 0.0
    if (
        profile_a["is_full_body"]
        and profile_a["style_family"] == "south_asian"
        and role_b == "layering"
        and profile_b["style_family"] != "south_asian"
    ):
        return 0.0
    if (
        profile_b["is_full_body"]
        and profile_b["style_family"] == "south_asian"
        and role_a == "layering"
        and profile_a["style_family"] != "south_asian"
    ):
        return 0.0

    if role_a == "layering" and role_b == "layering":
        return 0.0

    pair = {fine_a, fine_b}
    if "sherwani" in pair and pair & {"shorts", "mini skirt", "joggers", "cargo pants"}:
        return 0.0

    for kurti_fine, other_fine, kurti_tags in (
        (fine_a, fine_b, tags_a),
        (fine_b, fine_a, tags_b),
    ):
        if kurti_fine not in {"kurti", "kurta"}:
            continue
        length = normalize_fine_category(kurti_tags.get("length") or "medium")
        if length == "long" and other_fine in {"shorts", "mini skirt", "cargo pants"}:
            return 0.0
        if other_fine in {"jeans", "trousers", "leggings", "dhoti", "palazzo", "maxi skirt"}:
            return 1.15

    if "cardigan" in pair and pair & {"tube top", "crop top", "tank top", "t-shirt", "jeans", "trousers"}:
        return 1.1

    if profile_a["style_family"] == profile_b["style_family"] == "south_asian":
        return 1.1

    return 1.0


def is_structurally_valid_outfit(garments: list[dict[str, Any]]) -> bool:
    for i in range(len(garments)):
        for j in range(i + 1, len(garments)):
            if structural_compatibility_multiplier(garments[i], garments[j]) == 0.0:
                return False
    return True
