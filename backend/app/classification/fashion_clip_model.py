import torch
from transformers import CLIPModel, CLIPProcessor
from PIL import Image

MODEL_NAME = "patrickjohncyh/fashion-clip"

model = CLIPModel.from_pretrained(MODEL_NAME)
processor = CLIPProcessor.from_pretrained(MODEL_NAME)
model.eval()


def _unwrap(output):
    """Handles both plain-tensor and wrapped-output versions of transformers."""
    if hasattr(output, "detach"):
        return output
    return output.pooler_output


def embed_image(image: Image.Image) -> list:
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        features = model.get_image_features(**inputs)
    features = _unwrap(features)
    return features[0].detach().cpu().numpy().tolist()


def embed_texts(labels: list) -> list:
    inputs = processor(text=labels, return_tensors="pt", padding=True)
    with torch.no_grad():
        features = model.get_text_features(**inputs)
    features = _unwrap(features)
    return features.detach().cpu().numpy().tolist()