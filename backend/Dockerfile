FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libsm6 libxext6 libgl1 poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download MiniLM at build time so startup is fast
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Optional: CLIP + Whisper for local/high-memory deployments
ARG ENABLE_IMAGE_EMBED=false
ARG ENABLE_VOICE=false

RUN if [ "$ENABLE_IMAGE_EMBED" = "true" ]; then \
      pip install open-clip-torch==2.24.0 torchvision==0.18.0 && \
      python -c "import open_clip; open_clip.create_model_and_transforms('ViT-B-32', pretrained='openai')"; \
    fi

RUN if [ "$ENABLE_VOICE" = "true" ]; then \
      pip install openai-whisper==20231117 && \
      python -c "import whisper; whisper.load_model('base')"; \
    fi

COPY . .
RUN mkdir -p /app/uploads /app/data/seed_docs

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
