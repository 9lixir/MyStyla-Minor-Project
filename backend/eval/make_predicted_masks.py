"""
RUN FROM backend/:
    cd backend
    source venv/bin/activate
    python eval/make_predicted_masks.py
"""

import pathlib
import sys

BACKEND_DIR = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from PIL import Image

from app.scanning.remove_bg import remove_background

HERE = pathlib.Path(__file__).resolve().parent
IMAGES_DIR = HERE / "masks_images"
PRED_DIR = HERE / "masks_pred"
PRED_DIR.mkdir(exist_ok=True)

VALID_EXT = {".jpg", ".jpeg", ".png", ".webp"}
ALPHA_THRESHOLD = 128  # alpha >= this counts as "garment"


def main():
    images = sorted(p for p in IMAGES_DIR.iterdir() if p.suffix.lower() in VALID_EXT)
    if not images:
        print(f"No images in {IMAGES_DIR}. Copy your ~12 chosen originals there first.")
        sys.exit(1)

    for i, path in enumerate(images, 1):
        print(f"[{i}/{len(images)}] {path.name}")
        cutout_path = remove_background(str(path))          # transparent RGBA png
        cutout = Image.open(cutout_path).convert("RGBA")
        alpha = cutout.split()[-1]                          # the predicted mask
        mask = alpha.point(lambda a: 255 if a >= ALPHA_THRESHOLD else 0).convert("L")
        out = PRED_DIR / f"{path.stem}.png"
        mask.save(out)

    print(f"\nSaved {len(images)} predicted masks -> {PRED_DIR}")


if __name__ == "__main__":
    main()