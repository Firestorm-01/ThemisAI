from fastapi import APIRouter
from app.graph.knowledge_graph import get_graph_data

router = APIRouter()


@router.get("/data")
async def graph_data():
    """Return the full knowledge graph for frontend visualization."""
    return get_graph_data()
