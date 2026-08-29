import os
from PIL import Image
from app.classification.fashion_clip_model import embed_image
from app.classification.multi_label_tagger import tag_garment
from app.classification.normalization import normalize_pipeline_tags
from app.scanning.vector_store import update_garment_vector
import logging

logger = logging.getLogger(__name__)


def analyze_garment(image_path: str) -> dict:
    image = Image.open(image_path).convert("RGB")
    embedding = embed_image(image)
    result = tag_garment(embedding, image=image)
    return {
        "tags": result["tags"],
        "flags": result["flags"],
        "embedding": embedding,
    }


def get_cutout_path(original_filename: str, processed_dir: str = "processed") -> str:
    name, _ = os.path.splitext(original_filename)
    return os.path.join(processed_dir, f"{name}_cutout.png")


def process_and_update(garment_id: str, cutout_path: str) -> dict:
    """Full flow: classify + embed a cutout, then push results into the existing Qdrant point."""
    result = analyze_garment(cutout_path)
    raw_tags = result["tags"]
    matcher_tags = normalize_pipeline_tags(raw_tags, expand_occasion = True)
 
    logger.info(
        "garment=%s raw_category=%s matcher_category=%s",
        garment_id, raw_tags.get("category"), matcher_tags.get("category"),
    )
 
    update_garment_vector(garment_id, result["embedding"], matcher_tags)
 
    return {
        "tags": raw_tags,
        "matcher_tags": matcher_tags,
        "flags": result["flags"],
        "embedding": result["embedding"],
    }
