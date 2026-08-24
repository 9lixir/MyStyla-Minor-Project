"""
Compares each predicted mask (eval/masks_pred/) against its true mask
(eval/masks_true/) and reports IoU per image plus the mean.

IoU = |predicted AND true| / |predicted OR true|, computed over garment pixels.

Both masks are matched by filename stem, resized to the same size if needed, and
binarized at 128. True masks can be either plain black/white masks OR transparent
PNG cutouts (the alpha channel is used automatically).

RUN FROM backend/:
    cd backend
    source venv/bin/activate
    python eval/compute_iou.py
"""

import json
import pathlib
import sys

import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
PRED_DIR = HERE / "masks_pred"
TRUE_DIR = HERE / "masks_true"
OUT_PATH = HERE / "iou_report.json"

VALID_EXT = {".jpg", ".jpeg", ".png", ".webp"}
THRESH = 128


def load_binary_mask(path, size=None):
    img = Image.open(path)
    # If the image has real transparency, the alpha channel IS the mask.
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        mask = img.convert("RGBA").split()[-1]
    else:
        mask = img.convert("L")
    if size is not None and mask.size != size:
        mask = mask.resize(size, Image.NEAREST)
    arr = np.asarray(mask)
    return arr >= THRESH


def iou(pred, true):
    intersection = np.logical_and(pred, true).sum()
    union = np.logical_or(pred, true).sum()
    if union == 0:
        return 1.0  # both empty -> perfect (degenerate, shouldn't happen)
    return intersection / union


def main():
    preds = {p.stem: p for p in PRED_DIR.iterdir() if p.suffix.lower() in VALID_EXT} \
        if PRED_DIR.exists() else {}
    trues = {p.stem: p for p in TRUE_DIR.iterdir() if p.suffix.lower() in VALID_EXT} \
        if TRUE_DIR.exists() else {}

    common = sorted(set(preds) & set(trues))
    missing_true = sorted(set(preds) - set(trues))

    if not common:
        print("No matching mask pairs found.")
        print(f"  predicted masks: {sorted(preds)}")
        print(f"  true masks:      {sorted(trues)}")
        print("Filenames (without extension) must match between masks_pred/ and masks_true/.")
        sys.exit(1)

    if missing_true:
        print(f"[warn] no true mask for: {missing_true} (skipped)\n")

    results = {}
    scores = []
    for stem in common:
        # size the true mask to the predicted mask so the pixel grids line up
        pred = load_binary_mask(preds[stem])
        true = load_binary_mask(trues[stem], size=Image.open(preds[stem]).size)
        score = float(iou(pred, true))
        results[stem] = score
        scores.append(score)
        print(f"  {stem:30s} IoU = {score:.3f}")

    mean_iou = float(np.mean(scores))
    print(f"\nMean IoU over {len(scores)} images: {mean_iou:.3f}")

    with open(OUT_PATH, "w") as fh:
        json.dump({"mean_iou": mean_iou, "per_image": results}, fh, indent=2)
    print(f"Saved -> {OUT_PATH}")


if __name__ == "__main__":
    main()