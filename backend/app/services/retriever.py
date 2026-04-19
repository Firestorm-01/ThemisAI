import logging
from typing import List, Tuple
import numpy as np
from app.services.qdrant_service import get_qdrant_client, search_text, search_images
from app.services.embedder import embed_single_text, embed_image_text_query
from app.graph.knowledge_graph import get_related_nodes
from app.models.schemas import SourceDocument
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def retrieve(
    query: str,
    top_k: int = 5,
    use_graph: bool = True,
    include_images: bool = False,
) -> Tuple[List[SourceDocument], List[str]]:
    """
    Full retrieval pipeline:
    1. Embed query
    2. Search Qdrant (text + optional image)
    3. Rerank by score
    4. Enrich with graph context
    Returns (sources, graph_context)
    """
    client = get_qdrant_client()

    # 1. Text embedding + search
    text_vector = embed_single_text(query)
    text_results = search_text(client, text_vector, top_k=top_k + 2)

    # 2. Optional image search (cross-modal)
    image_results = []
    if include_images:
        img_vector = embed_image_text_query(query)
        image_results = search_images(client, img_vector, top_k=2)

    # 3. Build SourceDocument list
    sources: List[SourceDocument] = []
    seen_ids = set()

    for hit in text_results:
        if hit.id in seen_ids:
            continue
        seen_ids.add(hit.id)
        payload = hit.payload or {}
        sources.append(SourceDocument(
            id=str(hit.id),
            title=payload.get("title", "Legal Document"),
            content=payload.get("text", "")[:600],
            source_type=payload.get("source_type", "text"),
            page=payload.get("page"),
            score=round(hit.score, 4),
            section=payload.get("section"),
            file_name=payload.get("file_name", ""),
        ))

    for hit in image_results:
        if hit.id in seen_ids:
            continue
        seen_ids.add(hit.id)
        payload = hit.payload or {}
        sources.append(SourceDocument(
            id=str(hit.id),
            title=payload.get("title", "Legal Image"),
            content=payload.get("text", payload.get("ocr_text", "Image document"))[:400],
            source_type="image",
            page=None,
            score=round(hit.score, 4),
            file_name=payload.get("file_name", ""),
        ))

    # 4. Rerank: sort by score descending, take top_k
    sources = sorted(sources, key=lambda s: s.score, reverse=True)[:top_k]

    # 5. Graph context
    graph_context = []
    if use_graph:
        query_terms = _extract_terms(query)
        graph_context = get_related_nodes(query_terms, max_hops=2)

    return sources, graph_context


def _extract_terms(query: str) -> List[str]:
    """Extract meaningful terms from query for graph lookup."""
    import re
    terms = []
    # Section numbers
    section_nums = re.findall(r"\b\d+[A-Za-z]?\b", query)
    terms.extend(section_nums)
    # Legal keywords
    legal_kw = [
        "murder", "homicide", "rape", "theft", "bail", "fir", "arrest",
        "constitution", "article", "section", "ipc", "crpc", "supreme court",
        "fundamental right", "liberty", "equality", "freedom", "cheating",
        "extortion", "suicide", "negligence", "cruelty",
    ]
    q_lower = query.lower()
    for kw in legal_kw:
        if kw in q_lower:
            terms.append(kw)
    return list(set(terms))
