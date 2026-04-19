FROM python:3.11-slim

WORKDIR /app

# Added tesseract-ocr and libtesseract-dev
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

# 1. Install specific build tools and legacy setuptools for Whisper
RUN pip install --no-cache-dir --upgrade pip "setuptools<70.0.0" wheel

# 2. Install Whisper separately
RUN pip install --no-cache-dir openai-whisper==20231117 --no-build-isolation

# 3. Install the rest (Ensure pytesseract is in your requirements.txt!)
RUN pip install --no-cache-dir -r requirements.txt

# 4. Pre-cache models
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
RUN python -c "import whisper; whisper.load_model('base')"

COPY . .

RUN mkdir -p /app/uploads /app/data/seed_docs

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]