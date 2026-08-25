# fastapi routes for outfit matching

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import json

from app.outfit_matching.engine import build_around_garment, generate_outfits

router = APIRouter()


class GenerateOutfitsRequest(BaseModel):
    """request body for outfit generation"""
    user_id: str
    occasion: str
    top_k: Optional[int] = 10
    weather: Optional[dict] = None


class BuildAroundRequest(BaseModel):
    user_id: str
    garment_id: str
    occasion: Optional[str] = None
    top_k: Optional[int] = 5
    weather: Optional[dict] = None


@router.post("/generate")
async def generate_outfits_endpoint(request: GenerateOutfitsRequest):
    """generate ranked outfits for a user and occasion"""
    try:
        result = generate_outfits(
            user_id=request.user_id,
            occasion=request.occasion,
            top_k=request.top_k,
            weather=request.weather,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/build-around")
async def build_around_endpoint(request: BuildAroundRequest):
    try:
        return build_around_garment(
            user_id=request.user_id,
            garment_id=request.garment_id,
            occasion=request.occasion,
            top_k=request.top_k or 5,
            weather=request.weather,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/health")
async def health():
    """check outfit matcher health"""
    return {"status": "outfit_matching engine is running"}

