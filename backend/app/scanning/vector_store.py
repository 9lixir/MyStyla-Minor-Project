from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    HasIdCondition,
    MatchAny,
    PointStruct,
    VectorParams,
)
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", "wardrobe")

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

if not client.collection_exists(collection_name=COLLECTION_NAME):
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=512, distance=Distance.COSINE),
    )

def store_garment_vector(embedding: list, metadata: dict) -> str:
    garment_id = str(uuid.uuid4())

    client.upsert(
        collection_name = COLLECTION_NAME,
        points = [
            PointStruct(
                id = garment_id,
                vector = embedding,
                payload = metadata
            )
        ]
    )
    return garment_id

def search_similar(embedding: list, top_k: int=5) -> list:
    response = client.query_points(
        collection_name = COLLECTION_NAME,
        query = embedding,
        limit = top_k,
    )

    return[
        {
            "id": str(r.id),
            "score": r.score,
            "metadata": r.payload
        }
        for r in response.points
    ]


def search_similar_filtered(
    embedding: list[float],
    *,
    candidate_ids: list[str],
    occasion: str | None = None,
    top_k: int = 5,
    with_vectors: bool = False,
) -> list:
    if not candidate_ids:
        return []

    must_conditions = [HasIdCondition(has_id=candidate_ids)]
    if occasion:
        must_conditions.append(
            FieldCondition(
                key="tags.occasion",
                match=MatchAny(any=[occasion]),
            )
        )

    response = client.query_points(
        collection_name=COLLECTION_NAME,
        query=embedding,
        query_filter=Filter(must=must_conditions),
        limit=top_k,
        with_payload=True,
        with_vectors=with_vectors,
    )

    return [
        {
            "id": str(point.id),
            "score": point.score,
            "metadata": point.payload or {},
            "vector": point.vector if with_vectors else None,
        }
        for point in response.points
    ]

# Update an existing Qdrant point with real embedding + tags (not a new insert).

def update_garment_vector(garment_id: str, embedding: list, tags: dict):
    client.set_payload(
        collection_name=COLLECTION_NAME,
        payload={"tags": tags},
        points=[garment_id]
    )
    client.update_vectors(
        collection_name=COLLECTION_NAME,
        points=[PointStruct(id=garment_id, vector=embedding)]
    )


def update_garment_tags(garment_id: str, tags: dict):
    client.set_payload(
        collection_name=COLLECTION_NAME,
        payload={"tags": tags},
        points=[garment_id],
    )

def delete_garment_vector(garment_id: str) -> None:
    client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=[garment_id],
    )