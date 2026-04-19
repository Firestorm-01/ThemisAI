# ⚖ ThemisAI — Multi-Modal Graph RAG for Indian Law

> Justice, Retrieved. Query the IPC, Constitution, CrPC, and landmark judgments using text, documents, images, and voice.

---

## Architecture

```
User (React Frontend)
        │
        ├── Text / Voice / Image / PDF
        ▼
FastAPI Backend
        ├── Ingest Pipeline
        │     ├── PDF      → PyMuPDF → text chunks
        │     ├── Images   → CLIP embeddings + OCR
        │     └── Audio    → Whisper → transcript → chunks
        │
        ├── Embedding Layer
        │     ├── Text  → sentence-transformers/all-MiniLM-L6-v2 (dim=384)
        │     └── Image → CLIP ViT-B/32 (dim=512)
        │
        ├── Qdrant Vector DB (Docker)
        │     ├── themis_text   (384-dim)
        │     └── themis_images (512-dim)
        │
        ├── Knowledge Graph (NetworkX)
        │     └── IPC ↔ Constitution ↔ CrPC ↔ Cases
        │
        ├── Retriever (Top-K + graph enrichment)
        │
        └── Groq LLaMA 3.3 70B → Cited answer
```

---

## Quick Start (Docker)

### 1. Clone & configure

```bash
git clone https://github.com/YOUR_USERNAME/themis-ai.git
cd themis-ai
cp backend/.env.example backend/.env
# Edit backend/.env — add your GROQ_API_KEY
```

### 2. Launch

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Qdrant dashboard: http://localhost:6333/dashboard

### 3. Seed built-in data

After containers are running:

```bash
docker exec themis_backend python data/seed_data.py
```

This pre-loads 17 core Indian law documents (IPC, Constitution, CrPC, landmark cases) into Qdrant.

---

## Local Development (no Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # set GROQ_API_KEY, QDRANT_HOST=localhost
# Start Qdrant separately: docker run -p 6333:6333 qdrant/qdrant
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

---

## Render Deployment

### Backend (Web Service)

1. New Web Service → connect GitHub repo
2. **Root Directory:** `backend`
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Environment variables:**
   - `GROQ_API_KEY` = your key
   - `QDRANT_HOST` = your Qdrant Cloud cluster URL
   - `QDRANT_PORT` = 6333

> **Note:** Use [Qdrant Cloud](https://cloud.qdrant.io) (free tier) for persistent vector storage on Render.

### Frontend (Static Site)

1. New Static Site → connect GitHub repo
2. **Root Directory:** `frontend`
3. **Build Command:** `npm ci && npm run build`
4. **Publish Directory:** `dist`
5. **Redirect:** Add rewrite rule `/* → /index.html` (200)
6. **Environment variable:** `VITE_API_URL` = your Render backend URL

Update `frontend/src/utils/api.js` baseURL:
```js
baseURL: import.meta.env.VITE_API_URL || '/api'
```

---

## Project Structure

```
themis-ai/
├── backend/
│   ├── app/
│   │   ├── main.py              FastAPI app + lifespan
│   │   ├── config.py            Settings (pydantic-settings)
│   │   ├── core/startup.py      Service initialization
│   │   ├── routers/
│   │   │   ├── health.py        GET /api/health
│   │   │   ├── ingest.py        POST /api/ingest/upload
│   │   │   ├── query.py         POST /api/query/{text,audio,image}
│   │   │   └── graph.py         GET /api/graph/data
│   │   ├── services/
│   │   │   ├── qdrant_service.py  Vector DB client + collections
│   │   │   ├── embedder.py        MiniLM + CLIP embeddings
│   │   │   ├── pdf_service.py     PyMuPDF extraction + chunking
│   │   │   ├── image_service.py   PIL + OCR preprocessing
│   │   │   ├── whisper_service.py Audio transcription
│   │   │   ├── text_ingest.py     Plain text chunking
│   │   │   ├── retriever.py       Qdrant search + graph enrichment
│   │   │   └── llm_service.py     Groq LLaMA 3.3 70B generation
│   │   ├── graph/
│   │   │   └── knowledge_graph.py 40-node Indian law graph
│   │   └── models/schemas.py      Pydantic request/response models
│   ├── data/seed_data.py          17 pre-built Indian law documents
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx         Landing page
│   │   │   ├── Chat.jsx         3-panel query interface
│   │   │   ├── Ingest.jsx       Drag-drop file upload
│   │   │   └── GraphPage.jsx    D3 knowledge graph
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── SourcesPanel.jsx
│   │   │   ├── AudioRecorder.jsx
│   │   │   └── ToastContainer.jsx
│   │   ├── hooks/useToast.js
│   │   └── utils/api.js
│   ├── Dockerfile
│   └── nginx.conf
│
└── docker-compose.yml
```

---

## Supported Modalities

| Modality | Input formats | Processing |
|----------|--------------|------------|
| Text     | Typed query  | MiniLM embedding → Qdrant |
| PDF      | .pdf         | PyMuPDF → chunked → MiniLM |
| Image    | .png .jpg .webp .tiff | CLIP embedding + optional OCR |
| Audio    | .mp3 .wav .m4a .ogg | Whisper transcription → MiniLM |

---

## Literature Survey

For the presentation, the required research paper is:

> **"ReAct: Synergizing Reasoning and Acting in Language Models"**
> Shunyu Yao et al., ICLR 2023
> https://arxiv.org/abs/2210.03629

This covers AI Agents / Agentic Workflows — the ThemisAI retrieval pipeline is an agentic workflow: the LLM reasons over retrieved legal context and produces grounded, cited answers.

---

## Team

ThemisAI — Built for the Practical Design & Development of AI Applications course.
