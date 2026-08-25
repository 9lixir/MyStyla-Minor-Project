from rembg import remove, new_session
from PIL import Image
import io
import os

OUTPUT_DIR = "processed"
os.makedirs(OUTPUT_DIR, exist_ok = True)
MAX_REMBG_SIZE = int(os.getenv("REMBG_MAX_SIZE", "1024"))
REMBG_MODEL = os.getenv("REMBG_MODEL", "birefnet-general")


def _prepare_for_rembg(image_path: str) -> bytes:
    image = Image.open(image_path).convert("RGBA")
    image.thumbnail((MAX_REMBG_SIZE, MAX_REMBG_SIZE), Image.LANCZOS)

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def remove_background(image_path: str) -> str:
    input_data = _prepare_for_rembg(image_path)

    output_data = remove(
        input_data,
        session = new_session(REMBG_MODEL)
    )

    filename = os.path.splitext(os.path.basename(image_path))[0]
    output_path = os.path.join(OUTPUT_DIR, f"{filename}_cutout.png")

    image = Image.open(io.BytesIO(output_data)).convert("RGBA")
    image.save(output_path)

    return output_path
