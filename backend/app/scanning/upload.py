from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.scanning.remove_bg import remove_background
from app.scanning.color_extract import extract_colors
from app.scanning.vector_store import store_garment_vector, update_garment_tags
from app.scanning.preprocess import preprocess_image
from app.database import get_db
from app.models import Garment, GarmentClassification
from app.outfit_matching.config import CATEGORIES, FORMALITY, SEASON, PATTERN, OCCASION
from pydantic import BaseModel
from app.classification.classify import analyze_garment
import os

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok = True)

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
MAX_FILE_SIZE = 10*1024*1024 #10mb


class ClassificationUpdateRequest(BaseModel):
    user_id: str | None = None
    category: str
    formality: str
    season: str
    pattern: str
    occasion: list[str]


def _normalize_pipeline_tags(tags: dict) -> dict:
    category_map = {
        "shirt": "top",
        "t-shirt": "top",
        "sweater": "top",
        "jacket": "outerwear",
        "dress": "dress",
        "jeans": "bottom",
        "skirt": "bottom",
        "shorts": "bottom",
    }
    formality_map = {
        "casual": "Casual",
        "business casual": "Smart Casual",
        "formal": "Formal",
        "athletic": "Casual",
    }
    season_map = {
        "spring": "Spring",
        "summer": "Summer",
        "autumn": "Autumn",
        "winter": "Winter",
        "all-season": "Summer",
    }
    pattern_map = {
        "solid": "Solid",
        "striped": "Striped",
        "floral": "Floral",
        "plaid": "Checked",
        "polka dot": "Graphic",
        "graphic print": "Graphic",
    }
    occasion_map = {
        "everyday wear": "Casual",
        "work": "Office",
        "party": "Party",
        "workout": "Casual",
        "formal event": "Farewell",
    }

    raw_occasion = tags.get("occasion")
    raw_occasions = raw_occasion if isinstance(raw_occasion, list) else [raw_occasion]
    occasions = [occasion_map.get(str(value).lower(), value) for value in raw_occasions if value]
    occasions = [value for value in occasions if value in OCCASION]

    return {
        "category": category_map.get(str(tags.get("category", "")).lower(), "top"),
        "formality": formality_map.get(str(tags.get("formality", "")).lower(), "Casual"),
        "season": season_map.get(str(tags.get("season", "")).lower(), "Summer"),
        "pattern": pattern_map.get(str(tags.get("pattern", "")).lower(), "Solid"),
        "occasion": occasions or ["Casual"],
    }


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
    #only allowing images on here
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code = 400, 
            detail = "Invalid file type. Allowed: JPEG, PNG, WEBP"
            )
    
    #file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code = 400,
            detail = "File too large. Maximum size is 10 MB"
        )
    
    #saving the uploaded file as
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

    #preprocessing by resizing
    try:
        cutout_path = preprocess_image(cutout_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to preprocess image: {str(e)}")

    #extracting dominant colors
    try:
        colors = extract_colors(cutout_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Color extraction failed: {str(e)}")
    
    try:
        result = analyze_garment(cutout_path)
        suggested_classification = _normalize_pipeline_tags(result["tags"])

        #storing in qdrant with metadata
        metadata = {
            "filename" : file.filename,
            "original_path" : file_path,
            "cutout_path" : cutout_path,
            "dominant_colors" : colors,
            "tags": suggested_classification,
        }
        garment_id = store_garment_vector(result["embedding"], metadata)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store garment: {str(e)}")

    #save to database
    try:
        garment = Garment(
            id = garment_id,
            filename = file.filename,
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
            )
        )
        db.commit()
        db.refresh(garment)
    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail = f"Failed to save to database:{str(e)}"
        )

    return {
        "message": "Image uploaded and processed succesfully",
        "garment_id": garment_id,
        "filename": file.filename,
        "cutout": cutout_path,
        "dominant_colors": colors,
        "suggested_classification": suggested_classification,
        "tags": suggested_classification,
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
