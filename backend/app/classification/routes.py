from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.classification.classify import process_and_update, get_cutout_path
from app.classification.normalization import normalize_pipeline_tags
from app.database import get_db
from app.models import Garment, GarmentClassification

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

    tags = normalize_pipeline_tags(result["tags"])
    existing = db.query(GarmentClassification).filter(
        GarmentClassification.garment_id == garment_id
    ).first()

    if existing:
        existing.category = tags["category"]
        existing.formality = tags["formality"]
        existing.season = tags["season"]
        existing.pattern = tags["pattern"]
        existing.occasion = tags["occasion"]
    else:
        db.add(GarmentClassification(garment_id=garment_id, user_id=None, **tags))

    db.commit()
    return {"garment_id": garment_id, "tags": tags}
