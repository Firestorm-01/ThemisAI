from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    groq_api_key: str = ""
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_api_key: str = ""  # add this for cloud
    upload_dir: str = "./uploads"
    text_collection: str = "themis_text"
    image_collection: str = "themis_images"
    text_embed_dim: int = 384
    image_embed_dim: int = 512
    top_k: int = 5
    chunk_size: int = 800
    chunk_overlap: int = 100

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
