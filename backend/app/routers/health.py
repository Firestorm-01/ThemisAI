from fastapi import APIRouter
from app.services.qdrant_service import get_qdrant_client, get_collection_stats
from app.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/health")
async def health():
    try:
        client = get_qdrant_client()
        stats = get_collection_stats(client)
        return {
            "status": "ok",
            "qdrant": "connected",
            "collections": stats,
            "model": "llama-3.3-70b-versatile",
        }
    except Exception as e:
        return {"status": "degraded", "error": str(e)}
