from fastapi import APIRouter, HTTPException
from app.classification.classify import process_and_update, get_cutout_path

router = APIRouter()

@router.post("/garments/{garment_id}/classify")
def classify_garment(garment_id: str, original_filename: str):
    cutout_path = get_cutout_path(original_filename)
    try:
        result = process_and_update(garment_id, cutout_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")
    return {"garment_id": garment_id, "tags": result["tags"]}