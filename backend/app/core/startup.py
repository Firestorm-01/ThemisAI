import logging
from app.config import get_settings
from app.services.qdrant_service import get_qdrant_client, ensure_collections
from app.services.embedder import get_text_embedder, get_image_embedder
from app.services.whisper_service import get_whisper_model
from app.graph.knowledge_graph import get_knowledge_graph

logger = logging.getLogger(__name__)
settings = get_settings()


async def initialize_services():
    """Initialize all services on startup."""
    try:
        logger.info("Initializing Qdrant...")
        client = get_qdrant_client()
        ensure_collections(client)
        logger.info("Qdrant collections ready.")

        logger.info("Loading text embedder...")
        get_text_embedder()
        logger.info("Text embedder ready.")

        logger.info("Loading image embedder...")
        get_image_embedder()
        logger.info("Image embedder ready.")

        logger.info("Loading Whisper model...")
        get_whisper_model()
        logger.info("Whisper model ready.")

        logger.info("Loading knowledge graph...")
        get_knowledge_graph()
        logger.info("Knowledge graph ready.")

    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise
