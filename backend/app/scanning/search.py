from fastapi import APIRouter, HTTPException, Depends
from app.scanning.vector_store import search_similar
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Garment, GarmentClassification

router = APIRouter()

class SearchRequest(BaseModel):
    embedding: list[float]
    top_k: int = 5

@router.post("/search")
async def search_garments(request: SearchRequest):
    if len(request.embedding) != 512:
        raise HTTPException(
            status_code = 400,
            detail = "Embedding must be 512-dimensional"
        )
    
    results = search_similar(request.embedding, request.top_k)

    if not results:
        return {
            "message" : "No similar garments found",
            "results" : []
        }
    
    return{
        "message" : f"Found {len(results)} similar garments",
        "results" : results
    }

@router.get("/garments")
async def get_all_garments(db: Session = Depends(get_db)):
    garments = db.query(Garment).all()
    classifications = db.query(GarmentClassification).all()
    classification_by_garment_id = {c.garment_id: c for c in classifications}

    if not garments:
        return{
            "message": "No garments found",
            "garments":[]
        }
    
    return{
        "message": f"Found {len(garments)} garments",
        "garments": [
            {
                "id": g.id,
                "filename": g.filename,
                "cutout_path": g.cutout_path,
                "dominant_colors": g.dominant_colors,
                "created_at": g.created_at,
                "category": classification_by_garment_id[g.id].category if g.id in classification_by_garment_id else None,
                "tags": {
                    "formality": classification_by_garment_id[g.id].formality,
                    "season": classification_by_garment_id[g.id].season,
                    "pattern": classification_by_garment_id[g.id].pattern,
                    "occasion": classification_by_garment_id[g.id].occasion,
                } if g.id in classification_by_garment_id else None,
                "user_id": classification_by_garment_id[g.id].user_id if g.id in classification_by_garment_id else None,
            }
            for g in garments
        ]
    }