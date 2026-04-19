import logging
import numpy as np
from functools import lru_cache
from sentence_transformers import SentenceTransformer
from PIL import Image
import open_clip
import torch

logger = logging.getLogger(__name__)

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
    if _clip_model is None:
        _clip_model, _, _clip_preprocess = open_clip.create_model_and_transforms(
            "ViT-B-32", pretrained="openai"
        )
        _clip_tokenizer = open_clip.get_tokenizer("ViT-B-32")
        _clip_model.eval()
        logger.info("CLIP model loaded: ViT-B-32")
    return _clip_model, _clip_preprocess, _clip_tokenizer


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of text strings."""
    embedder = get_text_embedder()
    embeddings = embedder.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return embeddings.tolist()


def embed_single_text(text: str) -> list[float]:
    """Embed a single text string."""
    return embed_texts([text])[0]


def embed_image(image: Image.Image) -> list[float]:
    """Embed a PIL image using CLIP."""
    model, preprocess, _ = get_image_embedder()
    image_input = preprocess(image).unsqueeze(0)
    with torch.no_grad():
        features = model.encode_image(image_input)
        features = features / features.norm(dim=-1, keepdim=True)
    return features.squeeze().tolist()


def embed_image_text_query(text: str) -> list[float]:
    """Embed a text query into CLIP's image space for cross-modal search."""
    model, _, tokenizer = get_image_embedder()
    tokens = tokenizer([text])
    with torch.no_grad():
        features = model.encode_text(tokens)
        features = features / features.norm(dim=-1, keepdim=True)
    return features.squeeze().tolist()
