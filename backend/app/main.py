from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.routers import ingest, query, graph, health
from app.core.startup import initialize_services

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ThemisAI backend...")
    await initialize_services()
    logger.info("ThemisAI backend ready.")
    yield
    logger.info("Shutting down ThemisAI backend.")


app = FastAPI(
    title="ThemisAI API",
    description="Multi-Modal Graph RAG for Indian Law",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(ingest.router, prefix="/api/ingest", tags=["ingest"])
app.include_router(query.router, prefix="/api/query", tags=["query"])
app.include_router(graph.router, prefix="/api/graph", tags=["graph"])
