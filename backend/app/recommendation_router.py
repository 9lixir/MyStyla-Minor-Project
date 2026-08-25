from fastapi import APIRouter
from pydantic import BaseModel
from app.recommendation import recommend_accessories

router = APIRouter()


class ColorSwatch(BaseModel):
    hex: str


class GarmentInput(BaseModel):
    dominant_colors: list[ColorSwatch] = []


class OutfitInput(BaseModel):
    formality: str
    season: str | None = None
    user_id: str | None = None
    garments: list[GarmentInput] = []


@router.post("/accessories")
def get_accessory_recommendations(outfit: OutfitInput):
    garments_as_dicts = [g.model_dump() for g in outfit.garments]
    accessories = recommend_accessories(
        outfit.formality,
        garments_as_dicts,
        season=outfit.season,
        user_id=outfit.user_id,
    )
    return {"accessories": accessories}