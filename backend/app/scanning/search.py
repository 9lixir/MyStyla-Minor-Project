from fastapi import APIRouter, HTTPException, Depends
from app.scanning.vector_store import search_similar
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Garment
from app.scanning.vector_store import search_similar, client, COLLECTION_NAME

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

# @router.get("/garments")
# async def get_all_garments(db: Session = Depends(get_db)):
#     garments = db.query(Garment).all()

#     if not garments:
#         return{
#             "message": "No garments found",
#             "garments":[]
#         }
    
#     return{
#         "message": f"Found {len(garments)} garments",
#         "garments": [
#             {"id": g.id,
#             "filename": g.filename,
#             "cutout_path": g.cutout_path,
#             "dominant_colors": g.dominant_colors,
#             "created_at": g.created_at}
#             for g in garments
#         ]
#     }

# Additional route to get all garments with their tags from Qdrant. This is useful for displaying garments along with their classification tags in the frontend.
@router.get("/garments-with-tags")
async def get_all_garments_with_tags(db: Session = Depends(get_db)):
    garments = db.query(Garment).all()

    if not garments:
        return {
            "message": "No garments found",
            "garments": []
        }

    result = []
    for g in garments:
        tags = {}
        try:
            point = client.retrieve(collection_name=COLLECTION_NAME, ids=[g.qdrant_id])
            if point:
                tags = point[0].payload.get("tags", {})
        except Exception:
            pass  # garment not yet classified — tags stay empty

        result.append({
            "id": g.id,
            "filename": g.filename,
            "cutout_path": g.cutout_path,
            "dominant_colors": g.dominant_colors,
            "created_at": g.created_at,
            "tags": tags
        })

    return {
        "message": f"Found {len(result)} garments",
        "garments": result
    }