from PIL import Image
from app.classification.fashion_clip_model import classify_image

CATEGORY_LABELS = ["shirt", "t-shirt", "jacket", "dress", "jeans", "skirt", "sweater", "shorts"]
FORMALITY_LABELS = ["casual", "formal", "business casual", "athletic"]
SEASON_LABELS = ["summer", "winter", "spring", "autumn", "all-season"]
PATTERN_LABELS = ["solid", "striped", "floral", "plaid", "polka dot", "graphic print"]
OCCASION_LABELS = ["everyday wear", "party", "work", "workout", "formal event"]


def tag_garment(image: Image.Image) -> dict:
    """Run classification once per attribute type, return all tags as a dictionary."""
    return {
        "category": classify_image(image, CATEGORY_LABELS),
        "formality": classify_image(image, FORMALITY_LABELS),
        "season": classify_image(image, SEASON_LABELS),
        "pattern": classify_image(image, PATTERN_LABELS),
        "occasion": classify_image(image, OCCASION_LABELS),
    }