from fashion_clip.fashion_clip import FashionCLIP
from PIL import Image

# Loaded once when this module is first imported and not per request
fclip = FashionCLIP('fashion-clip')


def classify_image(image: Image.Image, labels: list) -> str:
    """Given an image and a list of candidate text labels, return the best-matching label."""
    result = fclip.zero_shot_classification([image], labels)
    return result[0]


def embed_image(image: Image.Image) -> list:
    """Return the 512-dim embedding vector for one image, as a plain Python list."""
    embedding = fclip.encode_images([image], batch_size=1)
    return embedding[0].tolist()