from PIL import Image

MODEL_NAME = "patrickjohncyh/fashion-clip"

model = None
processor = None


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
