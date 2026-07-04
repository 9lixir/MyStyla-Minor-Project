from fastapi import APIRouter, HTTPException
from app.scanning.vector_store import search_similar
from pydantic import BaseModel

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