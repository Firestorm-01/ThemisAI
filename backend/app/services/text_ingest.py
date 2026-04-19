import uuid
import re
import logging
from typing import List, Dict
from qdrant_client.models import PointStruct
from app.services.qdrant_service import upsert_text_points
from app.services.embedder import embed_texts

logger = logging.getLogger(__name__)


def chunk_plain_text(
    text: str,
    filename: str,
    source_type: str = "text",
    chunk_size: int = 800,
    overlap: int = 100,
) -> List[Dict]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks = []
    current = ""
    idx = 0

    for sentence in sentences:
        if len(current) + len(sentence) > chunk_size and current:
            chunks.append({
                "text": current.strip(),
                "chunk_idx": idx,
                "file_name": filename,
                "source_type": source_type,
            })
            current = current[-overlap:] + " " + sentence
            idx += 1
        else:
            current += " " + sentence

    if current.strip():
        chunks.append({
            "text": current.strip(),
            "chunk_idx": idx,
            "file_name": filename,
            "source_type": source_type,
        })

    return chunks


async def ingest_plain_text(text: str, filename: str, client) -> int:
    chunks = chunk_plain_text(text, filename, source_type="text")
    if not chunks:
        return 0

    texts = [c["text"] for c in chunks]
    vectors = embed_texts(texts)

    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vec,
            payload={
                "text": c["text"],
                "title": filename,
                "page": None,
                "chunk_idx": c["chunk_idx"],
                "file_name": filename,
                "source_type": "text",
            },
        )
        for c, vec in zip(chunks, vectors)
    ]

    for i in range(0, len(points), 100):
        upsert_text_points(client, points[i:i + 100])

    logger.info(f"Text ingested: {filename}, {len(points)} chunks")
    return len(points)
