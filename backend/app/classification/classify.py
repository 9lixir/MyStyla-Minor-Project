import os
from PIL import Image
from app.classification.fashion_clip_model import embed_image
from app.classification.multi_label_tagger import tag_garment
from app.scanning.vector_store import update_garment_vector


def analyze_garment(image_path: str) -> dict:
    image = Image.open(image_path).convert("RGB")
    embedding = embed_image(image)
    result = tag_garment(embedding)
    return {"tags": result["tags"], "flags": result["flags"], "embedding": embedding}


def get_cutout_path(original_filename: str, processed_dir: str = "processed") -> str:
    name, _ = os.path.splitext(original_filename)
    return os.path.join(processed_dir, f"{name}_cutout.png")


def process_and_update(garment_id: str, cutout_path: str) -> dict:
    """Full flow: classify + embed a cutout, then push results into the existing Qdrant point."""
    result = analyze_garment(cutout_path)
    update_garment_vector(garment_id, result["embedding"], result["tags"])
    return result