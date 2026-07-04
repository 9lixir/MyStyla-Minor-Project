from PIL import Image
import os

def preprocess_image(image_path: str) ->str:
    image = Image.open(image_path).convert("RGB")

    #resizing to 224x 224 as required by fashionclip
    image = image.resize((224,224), Image.LANCZOS)

    #save preprocessed image back to the same path
    image.save(image_path)

    return image_path