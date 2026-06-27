from fastapi import FastAPI
from app.scanning.upload import router as scanning_router

app = FastAPI()

app.include_router(scanning_router, prefix="/scanning")

@app.get("/")
def root():
    return {"message": "MyStyla Scanning Pipeline Running"}