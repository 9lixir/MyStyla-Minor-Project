from rembg import remove, new_session
from PIL import Image
import io
import os

OUTPUT_DIR = "processed"
os.makedirs(OUTPUT_DIR, exist_ok = True)

def remove_background(image_path: str) -> str:
    # opening the uploaded image
    with open(image_path, "rb") as f:
        input_data = f.read()

    # removing bg using birefnet-general to prevent fragmentation in pants legs
    output_data = remove(
        input_data,
        session = new_session("birefnet-general")
    )

    #saving the clean cutout as png
    filename = os.path.splitext(os.path.basename(image_path))[0]
    output_path = os.path.join(OUTPUT_DIR, f"{filename}_cutout.png")

    image = Image.open(io.BytesIO(output_data)).convert("RGBA")
    image.save(output_path)

    return output_path
