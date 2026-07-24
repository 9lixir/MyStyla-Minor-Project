from PIL import Image
import os
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

MODEL_NAME = "patrickjohncyh/fashion-clip"

model = None
processor = None
indofashion_service = None

def _load_model():
    """load fashionclip only when classification is used"""
    global model, processor
    if model is not None and processor is not None:
        return model, processor

    try:
        import torch
        from transformers import CLIPModel, CLIPProcessor
    except ImportError as exc:
        raise RuntimeError(
            "FashionCLIP classification needs torch and transformers installed"
        ) from exc

    model = CLIPModel.from_pretrained(MODEL_NAME)
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model.eval()
    return model, processor

def _load_indofashion_service():
    """Lazy load fine-tuned IndoFashion classification head"""
    global indofashion_service
    if indofashion_service is not None:
        return indofashion_service

    from ml_experiments.indofashion_service import IndoFashionService

    weights_path = ROOT_DIR / "ml_experiments" / "indofashion_head.pth"
    device = "cuda" if torch.cuda.is_available() else "cpu"
    indofashion_service = IndoFashionService(model_path=str(weights_path), device=device)
    return indofashion_service

def _unwrap(output):
    """Handles both plain-tensor and wrapped-output versions of transformers."""
    if hasattr(output, "detach"):
        return output
    return output.pooler_output


def embed_image(image: Image.Image) -> list:
    model, processor = _load_model()
    import torch

    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        features = model.get_image_features(**inputs)
    features = _unwrap(features)
    return features[0].detach().cpu().numpy().tolist()


def embed_texts(labels: list) -> list:
    model, processor = _load_model()
    import torch

    inputs = processor(text=labels, return_tensors="pt", padding=True)
    with torch.no_grad():
        features = model.get_text_features(**inputs)
    features = _unwrap(features)
    return features.detach().cpu().numpy().tolist()

def predict_indofashion(image: Image.Image) -> dict:
    """Predict category using fine-tuned IndoFashion head"""
    service = _load_indofashion_service()
    return service.predict(image)