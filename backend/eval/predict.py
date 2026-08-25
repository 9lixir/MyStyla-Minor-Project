"""
Generate predictions.json for the evaluation set.

Runs every image in eval/images/ through the SAME model pipeline the app uses
(FashionCLIP embedding -> multi-label tagger), then records the RAW tag labels
so they match the ground-truth vocabulary (casual / summer / plaid / work / ...).

Only `category` is normalized into the top/bottom/dress/outerwear bucket, because
that IS the label space we grade category on. The other four fields are taken
straight from the raw tagger output -- NOT from normalize_pipeline_tags(), which
rewrites them into pretty UI labels (Smart Casual, Office, Checked, Farewell)
that don't match the ground truth.

RUN FROM THE backend/ FOLDER:
    cd backend
    source venv/bin/activate
    python eval/predict.py

Output: eval/predictions.json
"""

import json
import pathlib
import sys

BACKEND_DIR = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from PIL import Image

from app.classification.fashion_clip_model import embed_image
from app.classification.multi_label_tagger import tag_garment
from app.classification.normalization import normalize_pipeline_tags

IMAGES_DIR = pathlib.Path(__file__).resolve().parent / "images"
OUT_PATH = pathlib.Path(__file__).resolve().parent / "predictions.json"

VALID_EXT = {".jpg", ".jpeg", ".png", ".webp"}


def _as_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).lower() for v in value]
    return [str(value).lower()]


def predict_one(image_path):
    image = Image.open(image_path).convert("RGB")
    embedding = embed_image(image)
    result = tag_garment(embedding, image=image)   # {"tags": {...raw...}, "flags": {...}}
    raw = result["tags"]

    # category: use the normalized bucket (top/bottom/dress/outerwear)
    norm = normalize_pipeline_tags(raw)

    # everything else: use the RAW tags, which already match ground-truth vocab
    return {
        "garment_id": image_path.stem,
        "category": norm.get("category", ""),
        "formality": str(raw.get("formality", "")).lower(),
        "season": str(raw.get("season", "")).lower(),
        "pattern": str(raw.get("pattern", "")).lower(),
        "occasion": _as_list(raw.get("occasion")),
    }


def main():
    images = sorted(p for p in IMAGES_DIR.iterdir() if p.suffix.lower() in VALID_EXT)
    if not images:
        print(f"No images found in {IMAGES_DIR}. Drop your test images there first.")
        sys.exit(1)

    predictions = []
    for i, path in enumerate(images, 1):
        print(f"[{i}/{len(images)}] {path.name}")
        try:
            predictions.append(predict_one(path))
        except Exception as e:
            print(f"   skipped ({e})")

    with open(OUT_PATH, "w") as fh:
        json.dump(predictions, fh, indent=2)
    print(f"\nWrote {len(predictions)} predictions -> {OUT_PATH}")


if __name__ == "__main__":
    main()