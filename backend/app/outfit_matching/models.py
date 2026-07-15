"""
models.py – Data contracts
Defines the exact schema a garment dict must have before it reaches the engine.
If real data drifts from this schema, validate_garment() fails loudly.
"""

from typing import Any


def validate_garment(garment: dict[str, Any]) -> None:
    """Ensure the garment dict has all required keys with correct types.
    Raises ValueError if validation fails.
    """
    required_keys = {
        "id": str,
        "category": str,
        "colors": list,  # dominant colors in color_extract format
        "tags": dict,    # must have formality, season, pattern, occasion
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
    
    # Validate tags structure
    required_tags = {"formality", "season", "pattern", "occasion"}
    if not isinstance(garment["tags"], dict):
        raise ValueError("Garment['tags'] must be a dict")
    
    missing_tags = required_tags - set(garment["tags"].keys())
    if missing_tags:
        raise ValueError(f"Garment['tags'] missing: {missing_tags}")
    
    # Validate embedding is 512-dimensional
    if len(garment["embedding"]) != 512:
        raise ValueError(
            f"Embedding must be 512-dim, got {len(garment['embedding'])}-dim"
        )
    
    # Validate colors list format
    for color in garment["colors"]:
        if not isinstance(color, dict) or "hsv" not in color:
            raise ValueError(
                "Each color in 'colors' must be a dict with 'hsv' key "
                "(from color_extract format)"
            )
