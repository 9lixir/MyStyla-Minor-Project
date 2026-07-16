# fastapi routes for outfit matching

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import json

from app.outfit_matching.engine import generate_outfits

router = APIRouter()


class GenerateOutfitsRequest(BaseModel):
    """request body for outfit generation"""
    user_id: str
    occasion: str
    top_k: Optional[int] = 10


@router.post("/generate")
async def generate_outfits_endpoint(request: GenerateOutfitsRequest):
    """generate ranked outfits for a user and occasion"""
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
    """check outfit matcher health"""
    return {"status": "outfit_matching engine is running"}

