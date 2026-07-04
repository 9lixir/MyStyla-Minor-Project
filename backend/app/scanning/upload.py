from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.scanning.remove_bg import remove_background
from app.scanning.color_extract import extract_colors
from app.scanning.vector_store import store_garment_vector
from app.scanning.preprocess import preprocess_image
from app.database import get_db
from app.models import Garment
import shutil
import os
import numpy as np

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok = True)

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
MAX_FILE_SIZE = 10*1024*1024 #10mb

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

    return {
        "message": "Image uploaded and processed succesfully",
        "garment_id": garment_id,
        "filename": file.filename,
        "cutout": cutout_path,
        "dominant_colors": colors
    }