import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional

from app.models.schemas import QueryRequest, QueryResponse, Modality
from app.services.retriever import retrieve
from app.services.llm_service import generate_answer, describe_image_with_llm
from app.services.embedder import embed_image, IMAGE_EMBED_ENABLED
from app.services.image_service import load_image
from app.services.whisper_service import transcribe_audio, VOICE_ENABLED
from app.services.qdrant_service import get_qdrant_client, search_images
from app.graph.knowledge_graph import get_related_nodes

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/text", response_model=QueryResponse)
async def query_text(request: QueryRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    try:
        sources, graph_context = retrieve(
            query=request.query,
            top_k=request.top_k,
            use_graph=request.use_graph,
            include_images=IMAGE_EMBED_ENABLED,
        )
        answer = generate_answer(
            query=request.query,
            sources=sources,
            graph_context=graph_context,
        )
        return QueryResponse(
            answer=answer,
            sources=sources,
            graph_context=graph_context,
            modality_used="text",
            query_used=request.query,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Query error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Query processing failed.")


@router.post("/audio", response_model=QueryResponse)
async def query_audio(
    file: UploadFile = File(...),
    top_k: int = Form(default=5),
    use_graph: bool = Form(default=True),
):
    if not VOICE_ENABLED:
        raise HTTPException(status_code=503, detail="Voice queries are disabled in this deployment.")

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "wav"
    if ext not in {"mp3", "wav", "m4a", "ogg", "webm"}:
        raise HTTPException(status_code=415, detail=f"Unsupported audio format: {ext}")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty audio file.")

    try:
        transcript = transcribe_audio(content, suffix=f".{ext}")
        if not transcript or len(transcript.strip()) < 3:
            raise HTTPException(status_code=422, detail="Could not transcribe audio. Please speak clearly.")

        sources, graph_context = retrieve(
            query=transcript, top_k=top_k, use_graph=use_graph,
            include_images=IMAGE_EMBED_ENABLED,
        )
        answer = generate_answer(
            query=transcript, sources=sources,
            graph_context=graph_context, modality_note="voice recording",
        )
        return QueryResponse(
            answer=answer, sources=sources, graph_context=graph_context,
            modality_used="audio", query_used=transcript,
        )
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Audio query error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Audio query processing failed.")


@router.post("/image", response_model=QueryResponse)
async def query_image(
    file: UploadFile = File(...),
    question: str = Form(default="What legal information does this document contain?"),
    top_k: int = Form(default=5),
    use_graph: bool = Form(default=True),
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    if ext not in {"png", "jpg", "jpeg", "webp", "tiff", "bmp"}:
        raise HTTPException(status_code=415, detail=f"Unsupported image format: {ext}")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty image file.")

    try:
        image = load_image(content)

        # If CLIP available: vector search image collection
        # If CLIP disabled: use Groq vision description as the query
        if IMAGE_EMBED_ENABLED:
            client = get_qdrant_client()
            img_vector = embed_image(image)
            img_hits = search_images(client, img_vector, top_k=3)
            effective_query = question
        else:
            # Describe the image via Groq, use description as query
            image_description = describe_image_with_llm(content, question)
            effective_query = image_description
            img_hits = []

        text_sources, graph_context = retrieve(
            query=effective_query, top_k=top_k,
            use_graph=use_graph, include_images=False,
        )

        # Merge CLIP image hits if available
        if img_hits:
            from app.models.schemas import SourceDocument
            for hit in img_hits:
                payload = hit.payload or {}
                text_sources.append(SourceDocument(
                    id=str(hit.id),
                    title=payload.get("title", "Image Document"),
                    content=payload.get("text", payload.get("ocr_text", ""))[:500],
                    source_type="image",
                    score=round(hit.score, 4),
                    file_name=payload.get("file_name", ""),
                ))
            text_sources = sorted(text_sources, key=lambda s: s.score, reverse=True)[:top_k]

        answer = generate_answer(
            query=effective_query, sources=text_sources,
            graph_context=graph_context, modality_note="uploaded image",
        )
        return QueryResponse(
            answer=answer, sources=text_sources, graph_context=graph_context,
            modality_used="image", query_used=effective_query,
        )
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Image query error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Image query processing failed.")
