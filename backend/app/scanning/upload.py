from fastapi import APIRouter, UploadFile, File, HTTPException
from app.scanning.remove_bg import remove_background
from app.scanning.color_extract import extract_colors
import shutil
import os

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

    # removing background
    cutout_path = remove_background(file_path)

    #extracting dominant colors
    colors = extract_colors(cutout_path)

    return {
        "message": "Image uploaded succesfully",
        "filename": file.filename,
        "original": file_path,
        "cutout": cutout_path,
        "dominant_colors": colors
    }