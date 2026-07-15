# router.py – FastAPI routes for outfit matching
"""
Exposes the outfit matching engine as HTTP endpoints.
Clients (frontend or CLI) POST to /generate to get ranked outfit combinations.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import json

from app.outfit_matching.engine import generate_outfits

router = APIRouter()


class GenerateOutfitsRequest(BaseModel):
    """Request body for /generate endpoint."""
    user_id: str
    occasion: str
    top_k: Optional[int] = 10


@router.post("/generate")
async def generate_outfits_endpoint(request: GenerateOutfitsRequest):
    """
    Generate ranked outfit combinations for a user + occasion.
    
    Example request:
        POST /outfits/generate
        {
            "user_id": "user123",
            "occasion": "Office",
            "top_k": 5
        }
    
    Returns: {
        "message": "Generated 5 outfit(s) for occasion 'Office'",
        "occasion": "Office",
        "wardrobe_size_after_filter": 12,
        "outfits": [
            {
                "garments": [
                    {"id": "garment-002", "category": "top", "dominant_colors": [...]},
                    {"id": "garment-004", "category": "bottom", "dominant_colors": [...]},
                    ...
                ],
                "harmony_score": 0.85,
                "compat_score": 0.72,
                "final_score": 0.782
            },
            ...
        ]
    }
    """
    try:
        result = generate_outfits(
            user_id=request.user_id,
            occasion=request.occasion,
            top_k=request.top_k,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    """Dummy endpoint for debugging."""
    return {"status": "outfit_matching engine is running"}

