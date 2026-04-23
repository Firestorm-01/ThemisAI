import logging
import os
import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Set ENABLE_IMAGE_EMBED=false on Render to skip CLIP (saves ~350MB RAM)
IMAGE_EMBED_ENABLED = os.getenv("ENABLE_IMAGE_EMBED", "true").lower() == "true"

_text_embedder: SentenceTransformer = None
_clip_model = None
_clip_preprocess = None
_clip_tokenizer = None


def get_text_embedder() -> SentenceTransformer:
    global _text_embedder
    if _text_embedder is None:
        _text_embedder = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Text embedder loaded: all-MiniLM-L6-v2")
    return _text_embedder


def get_image_embedder():
    global _clip_model, _clip_preprocess, _clip_tokenizer
    if not IMAGE_EMBED_ENABLED:
        return None, None, None
    if _clip_model is None:
        import open_clip
        _clip_model, _, _clip_preprocess = open_clip.create_model_and_transforms(
            "ViT-B-32", pretrained="openai"
        )
        _clip_tokenizer = open_clip.get_tokenizer("ViT-B-32")
        _clip_model.eval()
        logger.info("CLIP model loaded: ViT-B-32")
    return _clip_model, _clip_preprocess, _clip_tokenizer


def embed_texts(texts: list[str]) -> list[list[float]]:
    embedder = get_text_embedder()
    embeddings = embedder.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return embeddings.tolist()


def embed_single_text(text: str) -> list[float]:
    return embed_texts([text])[0]


def embed_image(image) -> list[float]:
    """Embed a PIL image using CLIP. Returns None if CLIP disabled."""
    if not IMAGE_EMBED_ENABLED:
        return None
    import torch
    model, preprocess, _ = get_image_embedder()
    image_input = preprocess(image).unsqueeze(0)
    with torch.no_grad():
        features = model.encode_image(image_input)
        features = features / features.norm(dim=-1, keepdim=True)
    return features.squeeze().tolist()


def embed_image_text_query(text: str) -> list[float]:
    """Embed text into CLIP image space. Returns None if CLIP disabled."""
    if not IMAGE_EMBED_ENABLED:
        return None
    import torch
    model, _, tokenizer = get_image_embedder()
    tokens = tokenizer([text])
    with torch.no_grad():
        features = model.encode_text(tokens)
        features = features / features.norm(dim=-1, keepdim=True)
    return features.squeeze().tolist()
