from app.database import SessionLocal
from app.models import Garment, GarmentClassification
from app.scanning.vector_store import client, COLLECTION_NAME


def get_wardrobe(user_id: str = None) -> list[dict]:
    """Load real wardrobe rows with joined tags and Qdrant vectors."""
    db = SessionLocal()
    try:
        garments = db.query(Garment).all()
        classifications = db.query(GarmentClassification).all()
    finally:
        db.close()

    if user_id:
        classifications = [
            classification
            for classification in classifications
            if classification.user_id == user_id
        ]
        classified_ids = {classification.garment_id for classification in classifications}
        garments = [garment for garment in garments if garment.id in classified_ids]

    classification_by_id = {c.garment_id: c for c in classifications}
    qdrant_ids = [g.qdrant_id for g in garments if g.qdrant_id]

    vectors_by_id: dict[str, list[float]] = {}
    if qdrant_ids:
        try:
            points = client.retrieve(
                collection_name=COLLECTION_NAME,
                ids=qdrant_ids,
                with_vectors=True,
                with_payload=False,
            )
            vectors_by_id = {str(point.id): point.vector for point in points if point.vector}
        except Exception:
            vectors_by_id = {}

    wardrobe: list[dict] = []
    for garment in garments:
        classification = classification_by_id.get(garment.id)
        if classification is None:
            continue

        embedding = vectors_by_id.get(garment.qdrant_id or "")
        if not embedding:
            # Keep matching fully real-data based: skip garments without stored vectors.
            continue

        wardrobe.append(
            {
                "id": garment.id,
                "filename": garment.filename,
                "cutout_path": garment.cutout_path,
                "category": classification.category,
                "colors": garment.dominant_colors,
                "tags": {
                    "formality": classification.formality,
                    "season": classification.season,
                    "pattern": classification.pattern,
                    "occasion": classification.occasion,
                    "style_family": classification.style_family, 
                },
                "embedding": embedding,
            }
        )

    return wardrobe
