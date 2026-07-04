from fastapi import FastAPI
from app.scanning.upload import router as scanning_router
from app.scanning.search import router as search_router
from app.database import engine
from app import models
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

models.Base.metadata.create_all(bind = engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["http://localhost:5173"],
    allow_credentials = True,
    allow_methods =["*"],
    allow_headers = ["*"],
)

#serving uploaded and processed images as static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/processed", StaticFiles(directory="processed"), name="processed")


app.include_router(scanning_router, prefix="/scanning")
app.include_router(search_router, prefix="/scanning")

@app.get("/")
def root():
    return {"message": "MyStyla Scanning Pipeline Running"}