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
    garments: list[GarmentInput] = []


@router.post("/accessories")
def get_accessory_recommendations(outfit: OutfitInput):
    """
    Accepts an outfit's formality and garments (each with dominant_colors),
    and returns the accessory recommendation for each slot (bag, footwear,
    jewelry) per a* = R(f, h_bar).

    Example request body:
    {
        "formality": "Formal",
        "garments": [
            { "dominant_colors": [{"hex": "#8B2E2E"}, {"hex": "#D9A441"}] }
        ]
    }
    """
    garments_as_dicts = [g.model_dump() for g in outfit.garments]
    accessories = recommend_accessories(outfit.formality, garments_as_dicts)
    return {"accessories": accessories}