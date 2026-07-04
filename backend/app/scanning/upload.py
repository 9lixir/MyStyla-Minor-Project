from fastapi import APIRouter, UploadFile, File, HTTPException
from app.scanning.remove_bg import remove_background
from app.scanning.color_extract import extract_colors
from app.scanning.vector_store import store_garment_vector
from app.scanning.preprocess import preprocess_image
import shutil
import os
import numpy as np

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok = True)

@router.post("/upload")
async def upload_grament(file: UploadFile = File(...)):
    #only allowing images on here
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code = 400, detail = "File must be an image")
    
    #saving the uploaded file as
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    #preprocessing by resizing
    preprocess_image(file_path)

    # removing background
    cutout_path = remove_background(file_path)

    #extracting dominant colors
    colors = extract_colors(cutout_path)

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

    return {
        "message": "Image uploaded and processed succesfully",
        "garment_id": garment_id,
        "filename": file.filename,
        "cutout": cutout_path,
        "dominant_colors": colors
    }