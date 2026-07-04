from fastapi import FastAPI
from app.scanning.upload import router as scanning_router
from app.scanning.search import router as search_router

app = FastAPI()

app.include_router(scanning_router, prefix="/scanning")
app.include_router(search_router, prefix="/scanning")

@app.get("/")
def root():
    return {"message": "MyStyla Scanning Pipeline Running"}