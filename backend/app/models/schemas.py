from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class Modality(str, Enum):
    text = "text"
    image = "image"
    audio = "audio"
    pdf = "pdf"


class QueryRequest(BaseModel):
    query: str
    modality: Modality = Modality.text
    top_k: int = 5
    use_graph: bool = True


class SourceDocument(BaseModel):
    id: str
    title: str
    content: str
    source_type: str  # pdf, text, image, audio
    page: Optional[int] = None
    score: float
    section: Optional[str] = None
    file_name: Optional[str] = None


class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceDocument]
    graph_context: Optional[List[str]] = None
    modality_used: str
    query_used: str


class IngestResponse(BaseModel):
    status: str
    message: str
    chunks_created: int
    file_name: str
    modality: str


class GraphNode(BaseModel):
    id: str
    label: str
    node_type: str
    connections: List[str]


class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[dict]
