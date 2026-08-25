from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

from app.scanning.upload import router as scanning_router
from app.scanning.search import router as search_router
from app.user_registration.auth_router import router as auth_router
from app.database import engine, ensure_database_schema
from app import models
from app.user_registration import user_models
from app.outfit_matching.router import router as outfit_router
from app.recommendation_router import router as recommendation_router
from app.classification.routes import router as classification_router
from app.weather.router import router as weather_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging

logging.basicConfig(level=logging.INFO)

cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
)

allow_origins = [
    origin.strip()
    for origin in cors_origins.split(",")
    if origin.strip()
]



os.makedirs("uploads", exist_ok=True)
os.makedirs("processed", exist_ok=True)

models.Base.metadata.create_all(bind = engine)
ensure_database_schema()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ],
    allow_credentials = True,
    allow_methods =["*"],
    allow_headers = ["*"],
)

#serving uploaded and processed images as static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/processed", StaticFiles(directory="processed"), name="processed")


app.include_router(scanning_router, prefix="/scanning")
app.include_router(search_router, prefix="/scanning")
app.include_router(auth_router)
app.include_router(outfit_router, prefix="/outfits")
app.include_router(recommendation_router, prefix="/recommend")
app.include_router(classification_router, prefix="/classification")
app.include_router(weather_router, prefix="/weather")

@app.get("/")
def root():
    return {"message": "MyStyla Scanning Pipeline Running"}

