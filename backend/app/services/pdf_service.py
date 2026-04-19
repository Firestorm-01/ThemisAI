import logging
import fitz  # PyMuPDF
import re
from typing import List, Dict

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_bytes: bytes, file_name: str) -> List[Dict]:
    """Extract text chunks from a PDF with metadata."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    chunks = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        text = _clean_text(text)
        if not text.strip():
            continue
        page_chunks = _chunk_text(text, page_num + 1, file_name)
        chunks.extend(page_chunks)

    doc.close()
    logger.info(f"Extracted {len(chunks)} chunks from {file_name}")
    return chunks


def _clean_text(text: str) -> str:
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\x00", "", text)
    return text.strip()


def _chunk_text(
    text: str,
    page_num: int,
    file_name: str,
    chunk_size: int = 800,
    overlap: int = 100,
) -> List[Dict]:
    """Split text into overlapping chunks."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks = []
    current = ""
    chunk_idx = 0

    for sentence in sentences:
        if len(current) + len(sentence) > chunk_size and current:
            chunks.append({
                "text": current.strip(),
                "page": page_num,
                "chunk_idx": chunk_idx,
                "file_name": file_name,
                "source_type": "pdf",
                "title": _infer_title(current, file_name),
            })
            # overlap: keep last `overlap` chars
            current = current[-overlap:] + " " + sentence
            chunk_idx += 1
        else:
            current += " " + sentence

    if current.strip():
        chunks.append({
            "text": current.strip(),
            "page": page_num,
            "chunk_idx": chunk_idx,
            "file_name": file_name,
            "source_type": "pdf",
            "title": _infer_title(current, file_name),
        })

    return chunks


def _infer_title(text: str, file_name: str) -> str:
    """Try to extract a section heading from the text."""
    patterns = [
        r"Section\s+\d+[A-Z]?\s*[-–—]?\s*([^\n]{5,60})",
        r"Article\s+\d+\s*[-–—]?\s*([^\n]{5,60})",
        r"^([A-Z][A-Z\s]{4,50})$",
    ]
    for pat in patterns:
        match = re.search(pat, text[:300], re.MULTILINE)
        if match:
            return match.group(0).strip()[:80]
    # fallback: first line
    first_line = text.strip().split("\n")[0]
    return first_line[:80] if first_line else file_name
