from typing import Any


def validate_garment(garment: dict[str, Any]) -> None:
    """validate the garment dict contract"""
    required_keys = {
        "id": str,
        "category": str,
        "colors": list,  # dominant colors from color_extract
        "tags": dict,  # formality season pattern occasion
        "embedding": list,
    }
    
    for key, expected_type in required_keys.items():
        if key not in garment:
            raise ValueError(f"Garment missing required key: '{key}'")
        if not isinstance(garment[key], expected_type):
            raise ValueError(
                f"Garment['{key}'] must be {expected_type.__name__}, "
                f"got {type(garment[key]).__name__}"
            )
    
    # validate tag shape
    required_tags = {"formality", "season", "pattern", "occasion"}
    if not isinstance(garment["tags"], dict):
        raise ValueError("Garment['tags'] must be a dict")
    
    missing_tags = required_tags - set(garment["tags"].keys())
    if missing_tags:
        raise ValueError(f"Garment['tags'] missing: {missing_tags}")
    
    # validate embedding size
    if len(garment["embedding"]) != 512:
        raise ValueError(
            f"Embedding must be 512-dim, got {len(garment['embedding'])}-dim"
        )
    
    # validate color shape
    for color in garment["colors"]:
        if not isinstance(color, dict) or "hsv" not in color:
            raise ValueError(
                "Each color in 'colors' must be a dict with 'hsv' key "
                "(from color_extract format)"
            )
