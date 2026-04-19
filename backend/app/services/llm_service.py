import logging
from groq import Groq
from app.config import get_settings
from app.models.schemas import SourceDocument
from typing import List, Optional

logger = logging.getLogger(__name__)
settings = get_settings()

_groq_client: Groq = None

SYSTEM_PROMPT = """You are ThemisAI, an expert Indian legal research assistant with deep knowledge of:
- Indian Penal Code (IPC), 1860
- Code of Criminal Procedure (CrPC), 1973
- Constitution of India, 1950
- Bharatiya Nyaya Sanhita (BNS), 2023 (replacement of IPC)
- Supreme Court and High Court judgments
- Legal procedures and rights under Indian law

STRICT RULES:
1. ONLY answer based on the provided source documents and graph context.
2. If the answer is not in the sources, say: "I could not find this in the retrieved documents. Please upload relevant legal texts or try a different query."
3. NEVER hallucinate section numbers, case names, or legal provisions.
4. ALWAYS cite section numbers (e.g., §302 IPC) and case names when referencing them.
5. Use precise legal language but explain clearly.
6. When sources conflict, acknowledge the conflict and cite both.
7. Structure your response with clear headings when answering complex queries.
8. If a query is about a specific court judgment, cite the year and bench if available in sources.

FORMAT:
- Use **bold** for section numbers and case names
- Use bullet points for lists of offences, punishments, or steps
- End with a "Sources relied upon:" line listing the §sections/cases used
"""


def get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=settings.groq_api_key)
        logger.info("Groq client initialized")
    return _groq_client


def build_context(sources: List[SourceDocument], graph_context: List[str]) -> str:
    """Build a clean context string from retrieved sources and graph nodes."""
    context_parts = []

    if sources:
        context_parts.append("=== RETRIEVED DOCUMENTS ===")
        for i, src in enumerate(sources, 1):
            context_parts.append(
                f"[Source {i}] {src.title}\n"
                f"Type: {src.source_type} | File: {src.file_name or 'N/A'}"
                + (f" | Page: {src.page}" if src.page else "")
                + f"\nRelevance: {src.score:.2f}\n"
                f"Content:\n{src.content}\n"
            )

    if graph_context:
        context_parts.append("=== KNOWLEDGE GRAPH CONTEXT ===")
        for node in graph_context:
            context_parts.append(f"• {node}")

    return "\n\n".join(context_parts)


def generate_answer(
    query: str,
    sources: List[SourceDocument],
    graph_context: List[str],
    modality_note: Optional[str] = None,
) -> str:
    """Generate a grounded answer using Groq LLaMA 3.3 70B."""
    client = get_groq_client()
    context = build_context(sources, graph_context)

    if not context.strip():
        return (
            "I could not find relevant documents to answer your query. "
            "Please upload relevant legal texts (IPC, Constitution, CrPC PDFs) "
            "or refine your query."
        )

    user_message = f"""QUERY: {query}

{f"NOTE: Query was transcribed from {modality_note}." if modality_note else ""}

CONTEXT FROM RETRIEVAL SYSTEM:
{context}

Based ONLY on the above retrieved documents and graph context, answer the query with precise legal citations."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.1,
            max_tokens=1500,
            top_p=0.9,
        )
        answer = response.choices[0].message.content.strip()
        logger.info(f"Generated answer: {len(answer)} chars, {response.usage.total_tokens} tokens")
        return answer

    except Exception as e:
        logger.error(f"Groq API error: {e}")
        raise RuntimeError(f"LLM generation failed: {str(e)}")
