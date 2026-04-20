FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (merged from both, ffmpeg always included)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1 \
    poppler-utils \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Upgrade pip and install legacy setuptools/wheel for compatibility (from v2)
RUN pip install --no-cache-dir --upgrade pip "setuptools<70.0.0" wheel

# Conditionally install Whisper with build isolation disabled (safer, from v2)
ARG ENABLE_VOICE=false
RUN if [ "$ENABLE_VOICE" = "true" ]; then \
      pip install --no-cache-dir openai-whisper==20231117 ffmpeg-python --no-build-isolation; \
    fi

# Install remaining dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Pre-cache sentence transformer model
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Pre-cache Whisper model only if voice is enabled
RUN if [ "$ENABLE_VOICE" = "true" ]; then \
      python -c "import whisper; whisper.load_model('base')"; \
    fi

COPY . .

RUN mkdir -p /app/uploads /app/data/seed_docs

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]