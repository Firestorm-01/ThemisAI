import uuid
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from qdrant_client.models import PointStruct

from app.services.qdrant_service import get_qdrant_client, upsert_text_points, upsert_image_points
from app.services.embedder import embed_texts, embed_image
from app.services.pdf_service import extract_text_from_pdf
from app.services.image_service import load_image, extract_text_from_image, image_to_metadata
from app.services.whisper_service import transcribe_audio
from app.services.text_ingest import ingest_plain_text
from app.models.schemas import IngestResponse

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_EXTENSIONS = {
    "pdf": "pdf",
    "png": "image", "jpg": "image", "jpeg": "image", "webp": "image", "tiff": "image",
    "mp3": "audio", "wav": "audio", "m4a": "audio", "ogg": "audio",
    "txt": "text",
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def _get_modality(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ALLOWED_EXTENSIONS.get(ext, "unknown")


@router.post("/upload", response_model=IngestResponse)
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    modality = _get_modality(file.filename)
    if modality == "unknown":
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type. Allowed: PDF, images (PNG/JPG/WEBP), audio (MP3/WAV/M4A), TXT.",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 50 MB limit.")
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    client = get_qdrant_client()
    chunks_created = 0

    try:
        if modality == "pdf":
            chunks_created = await _ingest_pdf(content, file.filename, client)

        elif modality == "image":
            chunks_created = await _ingest_image(content, file.filename, client)

        elif modality == "audio":
            ext = file.filename.rsplit(".", 1)[-1].lower()
            chunks_created = await _ingest_audio(content, file.filename, ext, client)

        elif modality == "text":
            chunks_created = await _ingest_text(content, file.filename, client)

    except Exception as e:
        logger.error(f"Ingest error [{file.filename}]: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

    return IngestResponse(
        status="success",
        message=f"Successfully ingested {file.filename}",
        chunks_created=chunks_created,
        file_name=file.filename,
        modality=modality,
    )


async def _ingest_pdf(content: bytes, filename: str, client) -> int:
    chunks = extract_text_from_pdf(content, filename)
    if not chunks:
        raise ValueError("No text could be extracted from PDF.")

    texts = [c["text"] for c in chunks]
    vectors = embed_texts(texts)

    points = []
    for chunk, vector in zip(chunks, vectors):
        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "text": chunk["text"],
                "title": chunk["title"],
                "page": chunk["page"],
                "chunk_idx": chunk["chunk_idx"],
                "file_name": filename,
                "source_type": "pdf",
            },
        ))

    # Batch upsert in groups of 100
    for i in range(0, len(points), 100):
        upsert_text_points(client, points[i:i + 100])

    logger.info(f"PDF ingested: {filename}, {len(points)} chunks")
    return len(points)


async def _ingest_image(content: bytes, filename: str, client) -> int:
    image = load_image(content)
    ocr_text = extract_text_from_image(image)
    metadata = image_to_metadata(image, filename, ocr_text)
    img_vector = embed_image(image)

    img_point = PointStruct(
        id=str(uuid.uuid4()),
        vector=img_vector,
        payload=metadata,
    )
    upsert_image_points(client, [img_point])

    # Also embed OCR text into text collection if useful
    if ocr_text and len(ocr_text) > 30:
        text_vector = embed_texts([ocr_text])[0]
        text_point = PointStruct(
            id=str(uuid.uuid4()),
            vector=text_vector,
            payload={
                "text": ocr_text,
                "title": f"OCR: {filename}",
                "page": 1,
                "chunk_idx": 0,
                "file_name": filename,
                "source_type": "image",
            },
        )
        upsert_text_points(client, [text_point])
        return 2

    return 1


async def _ingest_audio(content: bytes, filename: str, ext: str, client) -> int:
    suffix = f".{ext}"
    transcript = transcribe_audio(content, suffix=suffix)

    if not transcript or len(transcript.strip()) < 10:
        raise ValueError("Audio transcription returned empty result.")

    # Chunk transcript
    from app.services.text_ingest import chunk_plain_text
    chunks = chunk_plain_text(transcript, filename, source_type="audio")
    texts = [c["text"] for c in chunks]
    vectors = embed_texts(texts)

    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vec,
            payload={
                "text": c["text"],
                "title": f"Audio Transcript: {filename}",
                "page": None,
                "chunk_idx": c["chunk_idx"],
                "file_name": filename,
                "source_type": "audio",
            },
        )
        for c, vec in zip(chunks, vectors)
    ]

    upsert_text_points(client, points)
    logger.info(f"Audio ingested: {filename}, transcript length: {len(transcript)}, {len(points)} chunks")
    return len(points)


async def _ingest_text(content: bytes, filename: str, client) -> int:
    text = content.decode("utf-8", errors="replace")
    return await ingest_plain_text(text, filename, client)
