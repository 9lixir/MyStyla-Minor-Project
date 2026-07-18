from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.recommendation import recommend_accessories

router = APIRouter()


class ColorSwatch(BaseModel):
    hex: str


class GarmentInput(BaseModel):
    dominant_colors: list[ColorSwatch] = Field(default_factory=list)


class OutfitInput(BaseModel):
    formality: str
    garments: list[GarmentInput] = Field(default_factory=list)


@router.post("/accessories")
def get_accessory_recommendations(outfit: OutfitInput):
    garments_as_dicts = [g.model_dump() for g in outfit.garments]
    try:
        accessories = recommend_accessories(outfit.formality, garments_as_dicts)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"accessories": accessories}
