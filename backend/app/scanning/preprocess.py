from PIL import Image
import os

def preprocess_image(image_path: str) -> str:
    image = Image.open(image_path).convert("RGBA")
    
    #cropping tightly around the garment (removes empty transparent space)
    bbox = image.getbbox()  # finds the bounding box of non-transparent pixels
    if bbox:
        image = image.crop(bbox)
    
    #resize the tight crop to fit within 224x224 preserving aspect ratio
    ratio = min(224 / image.width, 224 / image.height)
    new_width = int(image.width * ratio)
    new_height = int(image.height * ratio)
    resized = image.resize((new_width, new_height), Image.LANCZOS)
    
    #placing the thing centered on 224x224 transparent canvas
    canvas = Image.new("RGBA", (224, 224), (0, 0, 0, 0))
    offset_x = (224 - new_width) // 2
    offset_y = (224 - new_height) // 2
    canvas.paste(resized, (offset_x, offset_y), mask=resized)
    
    png_path = os.path.splitext(image_path)[0] + ".png"
    canvas.save(png_path, format="PNG")
    
    return png_path