import logging
from functools import lru_cache
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue, SearchRequest
)
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_qdrant_client: QdrantClient = None


def get_qdrant_client() -> QdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = QdrantClient(
            host=settings.qdrant_host,
            port=settings.qdrant_port,
            api_key=settings.qdrant_api_key,  # add this
            https=True,                        # add this for cloud
            timeout=30,
        )
        logger.info(f"Qdrant connected at {settings.qdrant_host}:{settings.qdrant_port}")
    return _qdrant_client


def ensure_collections(client: QdrantClient):
    """Create collections if they don't exist."""
    existing = [c.name for c in client.get_collections().collections]

    if settings.text_collection not in existing:
        client.create_collection(
            collection_name=settings.text_collection,
            vectors_config=VectorParams(
                size=settings.text_embed_dim,
                distance=Distance.COSINE,
            ),
        )
        logger.info(f"Created collection: {settings.text_collection}")

    if settings.image_collection not in existing:
        client.create_collection(
            collection_name=settings.image_collection,
            vectors_config=VectorParams(
                size=settings.image_embed_dim,
                distance=Distance.COSINE,
            ),
        )
        logger.info(f"Created collection: {settings.image_collection}")


def upsert_text_points(client: QdrantClient, points: list[PointStruct]):
    client.upsert(collection_name=settings.text_collection, points=points)


def upsert_image_points(client: QdrantClient, points: list[PointStruct]):
    client.upsert(collection_name=settings.image_collection, points=points)


def search_text(client: QdrantClient, vector: list[float], top_k: int = 5) -> list:
    results = client.search(
        collection_name=settings.text_collection,
        query_vector=vector,
        limit=top_k,
        with_payload=True,
    )
    return results


def search_images(client: QdrantClient, vector: list[float], top_k: int = 3) -> list:
    results = client.search(
        collection_name=settings.image_collection,
        query_vector=vector,
        limit=top_k,
        with_payload=True,
    )
    return results


def get_collection_stats(client: QdrantClient) -> dict:
    try:
        text_info = client.get_collection(settings.text_collection)
        image_info = client.get_collection(settings.image_collection)
        return {
            "text_vectors": text_info.points_count,
            "image_vectors": image_info.points_count,
        }
    except Exception as e:
        logger.error(f"Stats error: {e}")
        return {"text_vectors": 0, "image_vectors": 0}
