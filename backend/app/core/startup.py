import logging
import os
from app.config import get_settings
from app.services.qdrant_service import get_qdrant_client, ensure_collections
from app.services.embedder import get_text_embedder, get_image_embedder, IMAGE_EMBED_ENABLED
from app.services.whisper_service import VOICE_ENABLED, get_whisper_model
from app.graph.knowledge_graph import get_knowledge_graph

logger = logging.getLogger(__name__)
settings = get_settings()


async def initialize_services():
    try:
        logger.info("Initializing Qdrant...")
        client = get_qdrant_client()
        ensure_collections(client)
        logger.info("Qdrant collections ready.")

        logger.info("Loading text embedder (MiniLM)...")
        get_text_embedder()
        logger.info("Text embedder ready.")

        if IMAGE_EMBED_ENABLED:
            logger.info("Loading CLIP image embedder...")
            get_image_embedder()
            logger.info("CLIP embedder ready.")
        else:
            logger.info("Image embedding disabled (ENABLE_IMAGE_EMBED=false) — using Groq vision fallback.")

        if VOICE_ENABLED:
            logger.info("Loading Whisper model...")
            get_whisper_model()
            logger.info("Whisper ready.")
        else:
            logger.info("Voice disabled (ENABLE_VOICE=false) — skipping Whisper.")

        logger.info("Loading knowledge graph...")
        get_knowledge_graph()
        logger.info("ThemisAI backend ready.")

    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise
