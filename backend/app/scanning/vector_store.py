from numpy import real
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid

client = QdrantClient(":memory:")

COLLECTION_NAME = "wardrobe"

client.create_collection(
    collection_name = COLLECTION_NAME,
    vectors_config = VectorParams(size=512, distance = Distance.COSINE)
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
    results = client.search(
        collection_name = COLLECTION_NAME,
        query_vector = embedding,
        limit = top_k
    )

    return[
        {
            "id": str(r.id),
            "score": r.score,
            "metadata": r.payload
        }
        for r in results
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