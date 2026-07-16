from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.scanning.remove_bg import remove_background
from app.scanning.color_extract import extract_colors
from app.scanning.vector_store import store_garment_vector
from app.scanning.preprocess import preprocess_image
from app.database import get_db
from app.models import Garment, GarmentClassification
from app.outfit_matching.config import CATEGORIES, FORMALITY, SEASON, PATTERN, OCCASION
from pydantic import BaseModel
import shutil
import os
import numpy as np

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


def _guess_category_from_filename(filename: str) -> str:
    name = filename.lower()
    category_keywords = {
        "top": ["shirt", "tee", "tshirt", "blouse", "top", "kurti", "sweater"],
        "bottom": ["pant", "jean", "trouser", "skirt", "short", "bottom"],
        "dress": ["dress", "gown"],
        "outerwear": ["jacket", "coat", "hoodie", "blazer", "cardigan"],
    }

    for category, keywords in category_keywords.items():
        if any(keyword in name for keyword in keywords):
            return category

    return "top"


def _build_initial_classification(filename: str) -> dict:
    category = _guess_category_from_filename(filename)
    default_occasion = ["Casual", "Office"]
    if category == "dress":
        default_occasion = ["Party", "Date", "Farewell"]

    return {
        "category": category,
        "formality": "Casual",
        "season": "Summer",
        "pattern": "Solid",
        "occasion": default_occasion,
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
async def upload_grament(file: UploadFile = File(...), db: Session = Depends(get_db)):
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
        #placeholder 512-d vector until FashionCLIP is integrated, muskan le fashion clip ko integrate nagare samma
        placeholder_embedding = np.random.rand(512).tolist()

        #storing in qdrant with metadata
        metadata = {
            "filename" : file.filename,
            "original_path" : file_path,
            "cutout_path" : cutout_path,
            "dominant_colors" : colors
        }
        garment_id = store_garment_vector(placeholder_embedding, metadata)
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
        db.commit()
        db.refresh(garment)
    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail = f"Failed to save to database:{str(e)}"
        )

    suggested_classification = _build_initial_classification(file.filename)

    return {
        "message": "Image uploaded and processed succesfully",
        "garment_id": garment_id,
        "filename": file.filename,
        "cutout": cutout_path,
        "dominant_colors": colors,
        "suggested_classification": suggested_classification,
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

    return {
        "message": "Garment classification saved",
        "garment_id": garment_id,
    }