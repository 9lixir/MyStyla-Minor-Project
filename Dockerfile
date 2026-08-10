# Backend for MyStyla — targets Hugging Face Spaces (Docker SDK).
# Spaces expects the app to listen on port 7860.

FROM python:3.12-slim

# System libs rembg/opencv/pillow need at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# HF Spaces runs as a non-root user (uid 1000); give it a writable home
# so model downloads (HuggingFace cache) and rembg models have somewhere to go.
ENV HOME=/app \
    HF_HOME=/app/.cache/huggingface \
    U2NET_HOME=/app/.cache/u2net \
    PYTHONUNBUFFERED=1

# Install deps first (better layer caching)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code and the fine-tuned head
COPY backend/ .
COPY ml_experiments/ ./ml_experiments/

# Writable dirs for uploads/processed (ephemeral — see note about persistence)
RUN mkdir -p uploads processed .cache/huggingface .cache/u2net \
    && chmod -R 777 uploads processed .cache

EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
