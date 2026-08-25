# MyStyla-Minor-Project

## Project Structure

- backend: FastAPI server
- frontend: React + Vite app

## Environment Setup

### Backend env file

Create or update backend/.env:

DATABASE_URL=sqlite:///./mystyla.db
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION_NAME=wardrobe
CORS_ORIGINS=http://localhost:5173

Notes:

- DATABASE_URL defaults to SQLite for local development.
- To use PostgreSQL, replace DATABASE_URL with your Postgres URL.
- Qdrant must be reachable at QDRANT_HOST:QDRANT_PORT.

### Frontend env file

Create or update frontend/.env:

VITE_API_BASE_URL=http://localhost:8000

## Prerequisites

- Python 3.10+
- Node.js 20+
- Docker (for Qdrant)

## Run Locally

### 1. Start Qdrant

From any terminal:

docker run -p 6333:6333 qdrant/qdrant

### 2. Start Backend

In a terminal from backend folder:

python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

Backend URLs:

- API root: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### 3. Start Frontend

In another terminal from frontend folder:

npm install
npm run dev

Frontend URL:

- App: http://localhost:5173

## Service Responsibilities

- FastAPI backend (port 8000): upload, background removal, color extraction, search endpoints
- React frontend (port 5173): auth, wardrobe/upload UI, and outfit matching UI
- Qdrant (port 6333): vector storage and similarity search
- SQLite file backend/mystyla.db: garment metadata
