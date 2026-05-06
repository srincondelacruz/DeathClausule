# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DeathClause** is a legal document contradiction detection system. Users upload PDFs (contracts, annexes, addenda), the system extracts clauses, generates embeddings, and detects semantic contradictions between clauses across documents. Results are presented as an interactive contradiction graph and a detailed textual report.

## Architecture

```
Upload PDFs → Clause Extraction → Embeddings → ChromaDB → Semantic Cross-check → Output
                (PyMuPDF + LLM)   (Azure OpenAI)                (similarity + LLM)
```

**Two output views:**
- Interactive graph (D3.js): nodes = clauses, red edges = contradictions (thickness = severity)
- Detailed report: each contradictory pair explained in text

## Stack

| Layer | Technology |
|---|---|
| Backend | Python + FastAPI |
| Frontend | React + Tailwind CSS |
| AI | Azure OpenAI (embeddings + GPT-4o) |
| Vector DB | ChromaDB |
| PDF parsing | PyMuPDF |
| Visualization | D3.js |

## Project Structure (target)

```
DeathClause/
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── routers/              # upload, analysis, results endpoints
│   ├── services/
│   │   ├── extractor.py      # PyMuPDF + LLM clause chunking
│   │   ├── embeddings.py     # Azure OpenAI embeddings
│   │   ├── vector_store.py   # ChromaDB operations
│   │   └── contradictions.py # Semantic cross-check + LLM analysis
│   └── models/               # Pydantic schemas
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Upload/       # PDF upload UI
│   │   │   ├── Graph/        # D3.js contradiction graph
│   │   │   └── Report/       # Textual contradiction report
│   │   └── api/              # Backend API client
└── CLAUDE.md
```

## Key Domain Concepts

- **Clause chunking**: LLM splits PDF text by complete clauses (not paragraphs), preserving clause number, title, and body. Metadata stored: source document, clause number, page.
- **Contradiction detection flow**: for each clause, find N most semantically similar clauses (cosine similarity) from *other* documents or sections → pass each candidate pair to LLM with contradiction prompt → LLM returns verdict + explanation.
- **Severity**: contradictions are scored by severity, which drives edge thickness in the D3.js graph.

## Development Workflow

This project follows the **PIV methodology (Plan → Implement → Validate)**:
1. Create a detailed plan per module before coding
2. Implement module by module (extraction → embeddings → API → frontend)
3. Validate with linting, types, tests, and a real PDF

## Commands (once scaffold is in place)

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload          # dev server
pytest                             # run all tests
pytest tests/test_extractor.py     # run single test file
mypy .                             # type check
ruff check .                       # lint
```

### Frontend
```bash
cd frontend
npm install
npm run dev                        # dev server
npm run build                      # production build
npm run lint                       # ESLint
```

## Environment Variables (backend)

```
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT_EMBEDDINGS=
AZURE_OPENAI_DEPLOYMENT_GPT4O=
CHROMA_PERSIST_DIR=./chroma_db
```
