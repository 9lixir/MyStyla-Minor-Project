from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.scanning.remove_bg import remove_background
from app.scanning.color_extract import extract_colors
from app.scanning.vector_store import store_garment_vector, update_garment_metadata, update_garment_tags
from app.scanning.preprocess import preprocess_image
from app.database import get_db
from app.models import Garment, GarmentClassification
from app.outfit_matching.config import CATEGORIES, FORMALITY, SEASON, PATTERN, OCCASION
from pydantic import BaseModel
from app.classification.classify import analyze_garment
from app.classification.normalization import normalize_pipeline_tags
import os
from app.scanning.vector_store import delete_garment_vector
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10mb


class ClassificationUpdateRequest(BaseModel):
    user_id: str | None = None
    category: str
    formality: str
    season: str
    pattern: str
    occasion: list[str]


class GarmentDetailsUpdateRequest(ClassificationUpdateRequest):
    filename: str | None = None


def _validate_classification(payload: ClassificationUpdateRequest) -> None:
    if payload.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Allowed: {CATEGORIES}")
    if payload.formality not in FORMALITY:
        raise HTTPException(status_code=400, detail=f"Invalid formality. Allowed: {FORMALITY}")
    if payload.season not in SEASON:
        raise HTTPException(status_code=400, detail=f"Invalid season. Allowed: {SEASON}")
    if payload.pattern not in PATTERN:
        raise HTTPException(status_code=400, detail=f"Invalid pattern. Allowed: {PATTERN}")
    if not payload.occasion:
        raise HTTPException(status_code=400, detail="Occasion must contain at least one value")

    invalid_occasion = [value for value in payload.occasion if value not in OCCASION]
    if invalid_occasion:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid occasion value(s): {invalid_occasion}. Allowed: {OCCASION}",
        )


@router.post("/upload")
async def upload_garment(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # only allowing images on here
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Allowed: JPEG, PNG, WEBP"
        )
    
    # file size checking
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10 MB"
        )
    
    # saving the uploaded file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")

    # removing background
    try:
        cutout_path = remove_background(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")

    # preprocessing by resizing
    try:
        cutout_path = preprocess_image(cutout_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to preprocess image: {str(e)}")

    # extracting dominant colors
    try:
        colors = extract_colors(cutout_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Color extraction failed: {str(e)}")
    
    try:
        result = analyze_garment(cutout_path)
        
        # Merged changes: extraction of vectors/flags alongside normalization logic
        embedding = result["embedding"]
        flags = result["flags"]
        suggested_classification = normalize_pipeline_tags(result["tags"])

        # storing in qdrant with metadata
        metadata = {
            "filename": file.filename,
            "original_path": file_path,
            "cutout_path": cutout_path,
            "dominant_colors": colors,
            "tags": suggested_classification,
        }
        garment_id = store_garment_vector(embedding, metadata)
    except Exception as e:
        logger.exception("upload store failed")
        raise HTTPException(status_code=500, detail=f"Failed to store garment: {str(e)}")

    # save to database
    try:
        garment = Garment(
            id=garment_id,
            filename=file.filename,
            original_path=file_path,
            cutout_path=cutout_path,
            dominant_colors=colors,
            qdrant_id=garment_id
        )
        db.add(garment)
        db.add(
            GarmentClassification(
                garment_id=garment_id,
                user_id=None,
                category=suggested_classification["category"],
                formality=suggested_classification["formality"],
                season=suggested_classification["season"],
                pattern=suggested_classification["pattern"],
                occasion=suggested_classification["occasion"],
                style_family=suggested_classification["style_family"],
            )
        )
        db.commit()
        db.refresh(garment)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save to database: {str(e)}"
        )

    return {
        "message": "Image uploaded and processed successfully",
        "garment_id": garment_id,
        "filename": file.filename,
        "cutout": cutout_path,
        "dominant_colors": colors,
        "tags": result["tags"],
        "suggested_classification": result["tags"],
        "matcher_tags": suggested_classification,
        "flags": flags,
    }


@router.put("/garments/{garment_id}/classification")
async def save_garment_classification(
    garment_id: str,
    payload: ClassificationUpdateRequest,
    db: Session = Depends(get_db),
):
    garment = db.query(Garment).filter(Garment.id == garment_id).first()
    if not garment:
        raise HTTPException(status_code=404, detail="Garment not found")

    # Normalize the incoming user payload so fine-grained tags (e.g., "Kurti") map to core CATEGORIES ("top")
    normalized_tags = normalize_pipeline_tags({
        "category": payload.category,
        "formality": payload.formality,
        "season": payload.season,
        "pattern": payload.pattern,
        "occasion": payload.occasion,
    })

    # Update payload with normalized values before validating
    payload.category = normalized_tags["category"]
    payload.formality = normalized_tags["formality"]
    payload.season = normalized_tags["season"]
    payload.pattern = normalized_tags["pattern"]
    payload.occasion = normalized_tags["occasion"]

    _validate_classification(payload)

    existing = (
        db.query(GarmentClassification)
        .filter(GarmentClassification.garment_id == garment_id)
        .first()
    )

    if existing:
        existing.user_id = payload.user_id
        existing.category = payload.category
        existing.formality = payload.formality
        existing.season = payload.season
        existing.pattern = payload.pattern
        existing.occasion = payload.occasion
    else:
        classification = GarmentClassification(
            garment_id=garment_id,
            user_id=payload.user_id,
            category=payload.category,
            formality=payload.formality,
            season=payload.season,
            pattern=payload.pattern,
            occasion=payload.occasion,
        )
        db.add(classification)

    db.commit()
    update_garment_tags(
        garment.qdrant_id,
        {
            "category": payload.category,
            "formality": payload.formality,
            "season": payload.season,
            "pattern": payload.pattern,
            "occasion": payload.occasion,
        },
    )

    return {
        "message": "Garment classification saved",
        "garment_id": garment_id,
    }


@router.put("/garments/{garment_id}/details")
async def update_garment_details(
    garment_id: str,
    payload: GarmentDetailsUpdateRequest,
    db: Session = Depends(get_db),
):
    garment = db.query(Garment).filter(Garment.id == garment_id).first()
    if not garment:
        raise HTTPException(status_code=404, detail="Garment not found")

    normalized_name = (payload.filename or "").strip()
    if normalized_name:
        garment.filename = normalized_name

    normalized_tags = normalize_pipeline_tags({
        "category": payload.category,
        "formality": payload.formality,
        "season": payload.season,
        "pattern": payload.pattern,
        "occasion": payload.occasion,
    })

    payload.category = normalized_tags["category"]
    payload.formality = normalized_tags["formality"]
    payload.season = normalized_tags["season"]
    payload.pattern = normalized_tags["pattern"]
    payload.occasion = normalized_tags["occasion"]
    _validate_classification(payload)

    existing = (
        db.query(GarmentClassification)
        .filter(GarmentClassification.garment_id == garment_id)
        .first()
    )
    if existing:
        existing.user_id = payload.user_id
        existing.category = payload.category
        existing.formality = payload.formality
        existing.season = payload.season
        existing.pattern = payload.pattern
        existing.occasion = payload.occasion
    else:
        db.add(
            GarmentClassification(
                garment_id=garment_id,
                user_id=payload.user_id,
                category=payload.category,
                formality=payload.formality,
                season=payload.season,
                pattern=payload.pattern,
                occasion=payload.occasion,
            )
        )

    db.commit()
    db.refresh(garment)

    qdrant_payload = {
        "filename": garment.filename,
        "tags": {
            "category": payload.category,
            "formality": payload.formality,
            "season": payload.season,
            "pattern": payload.pattern,
            "occasion": payload.occasion,
        },
    }
    try:
        update_garment_metadata(garment.qdrant_id, qdrant_payload)
    except Exception:
        pass

    return {
        "message": "Garment details updated",
        "garment": {
            "id": garment.id,
            "filename": garment.filename,
            "cutout_path": garment.cutout_path,
            "dominant_colors": garment.dominant_colors,
            "category": payload.category,
            "tags": qdrant_payload["tags"],
            "user_id": payload.user_id,
        },
    }


@router.delete("/garments/{garment_id}")
async def delete_garment(garment_id: str, db: Session = Depends(get_db)):
    garment = db.query(Garment).filter(Garment.id == garment_id).first()
    if not garment:
        raise HTTPException(status_code=404, detail="Garment not found")

    # Remove classification row(s) first (FK safety)
    db.query(GarmentClassification).filter(
        GarmentClassification.garment_id == garment_id
    ).delete()

    # Remove image files from disk, best-effort
    for path in (garment.original_path, garment.cutout_path):
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass

    db.delete(garment)
    db.commit()

    # Remove the vector/point from Qdrant, best-effort
    try:
        delete_garment_vector(garment.qdrant_id)
    except Exception:
        pass

    return {"message": "Garment deleted", "garment_id": garment_id}