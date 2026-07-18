from fastapi import APIRouter, HTTPException, Depends
from app.classification.classify import process_and_update, get_cutout_path
import uuid
from app.models import TagCorrection
from app.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/garments/{garment_id}/classify")
def classify_garment(garment_id: str, original_filename: str, db: Session = Depends(get_db)):
    garment = db.query(Garment).filter(Garment.id == garment_id).first()
    if not garment:
        raise HTTPException(status_code=404, detail="Garment not found")

    cutout_path = get_cutout_path(original_filename)
    try:
        result = process_and_update(garment_id, cutout_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")
    return {"garment_id": garment_id, "tags": result["tags"]}

@router.post("/garments/{garment_id}/correct-tag")
def correct_tag(garment_id: str, field:str, predicted: str,corrected:str, db: Session = Depends(get_db)):
    if predicted != corrected:
        entry = TagCorrection(
            id = str(uuid.uuid4()),
            garment_id = garment_id,
            field = field,
            predicted_value = predicted,
            corrected_value = corrected

        )
        db.add(entry)
        db.commit()
       
    return {"status": "logged" if predicted != corrected else "no change"}