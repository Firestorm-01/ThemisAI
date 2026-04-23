import logging
import os
import numpy as np
from fastembed import TextEmbedding

logger = logging.getLogger(__name__)

IMAGE_EMBED_ENABLED = os.getenv("ENABLE_IMAGE_EMBED", "true").lower() == "true"

_text_embedder: TextEmbedding = None

def get_text_embedder() -> TextEmbedding:
    global _text_embedder
    if _text_embedder is None:
        _text_embedder = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
        logger.info("Text embedder loaded: all-MiniLM-L6-v2 (fastembed/ONNX)")
    return _text_embedder

def embed_texts(texts: list[str]) -> list[list[float]]:
    embedder = get_text_embedder()
    embeddings = list(embedder.embed(texts))
    return [e.tolist() for e in embeddings]

def embed_single_text(text: str) -> list[float]:
    return embed_texts([text])[0]

def embed_image(image) -> list[float]:
    """Image embedding disabled on free tier."""
    if not IMAGE_EMBED_ENABLED:
        return None
    logger.warning("CLIP not available — image embedding skipped.")
    return None

def embed_image_text_query(text: str) -> list[float]:
    """Image-text query embedding disabled on free tier."""
    if not IMAGE_EMBED_ENABLED:
        return None
    return None