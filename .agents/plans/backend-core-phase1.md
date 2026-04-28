# Feature: Backend Core — Fase 1

The following plan should be complete, but validate documentation and codebase patterns before implementing.
The repo is greenfield — there are no existing files to mirror patterns from. Follow the conventions defined here.

## Feature Description

Construir el backend completo de DeathClausule: un pipeline FastAPI que recibe PDFs, extrae cláusulas con PyMuPDF + GPT-4o, genera embeddings con Azure OpenAI, los almacena en ChromaDB y detecta contradicciones entre cláusulas de distintos documentos. Expone tres endpoints REST: `/upload`, `/analyze/{session_id}`, `/results/{analysis_id}`.

## User Story

As a legal professional,
I want to upload multiple PDFs and receive a list of contradictory clause pairs with explanations,
So that I can quickly identify conflicts between contracts without manual review.

## Problem Statement

El backend debe orquestar cuatro servicios en secuencia (extracción → embeddings → almacenamiento → detección) y exponer los resultados via API REST. Todo desde cero (repo greenfield).

## Solution Statement

FastAPI con routers separados por dominio, servicios desacoplados y un pipeline lineal y síncrono para el MVP. ChromaDB en modo persistente local. Azure OpenAI para embeddings y GPT-4o.

## Feature Metadata

**Feature Type**: New Capability  
**Estimated Complexity**: High  
**Primary Systems Affected**: Todos (greenfield)  
**Dependencies**: fastapi, uvicorn, pymupdf, openai (Azure), chromadb, python-dotenv, pydantic

---

## CONTEXT REFERENCES

### Relevant Codebase Files

Repo greenfield — no hay archivos existentes. El agente debe crear todo desde cero siguiendo este plan.

### New Files to Create

```
backend/
├── main.py
├── .env.example
├── requirements.txt
├── routers/
│   ├── __init__.py
│   ├── upload.py
│   ├── analysis.py
│   └── results.py
├── services/
│   ├── __init__.py
│   ├── extractor.py
│   ├── embeddings.py
│   ├── vector_store.py
│   └── contradictions.py
├── models/
│   ├── __init__.py
│   └── schemas.py
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_extractor.py
    ├── test_embeddings.py
    ├── test_vector_store.py
    └── test_contradictions.py
```

### Relevant Documentation

- [FastAPI docs — bigger applications](https://fastapi.tiangolo.com/tutorial/bigger-applications/)
  - Why: Patrón de routers con `APIRouter` y registro en `main.py`
- [FastAPI — File uploads](https://fastapi.tiangolo.com/tutorial/request-files/)
  - Why: `UploadFile` y `File(...)` para recibir múltiples PDFs
- [PyMuPDF docs](https://pymupdf.readthedocs.io/en/latest/tutorial.html)
  - Why: `fitz.open()` para abrir PDFs desde bytes en memoria
- [ChromaDB docs — Python client](https://docs.trychroma.com/getting-started)
  - Why: `chromadb.PersistentClient`, `collection.add()`, `collection.query()`
- [Azure OpenAI — Embeddings](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#embeddings)
  - Why: `AzureOpenAI` client, `client.embeddings.create()`
- [Azure OpenAI — Chat completions](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#chat-completions)
  - Why: `client.chat.completions.create()` para GPT-4o

### Patterns to Follow

**Naming conventions:**
- Archivos y variables: `snake_case`
- Clases Pydantic: `PascalCase`
- Constantes: `UPPER_SNAKE_CASE`
- IDs de sesión/análisis: `uuid4()` como string

**Error handling:**
```python
from fastapi import HTTPException
raise HTTPException(status_code=400, detail="Only PDF files are allowed")
```

**Configuración con dotenv:**
```python
from dotenv import load_dotenv
import os
load_dotenv()
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
```

**Azure OpenAI client:**
```python
from openai import AzureOpenAI
client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
)
```

**PyMuPDF desde bytes (sin escribir a disco):**
```python
import fitz
doc = fitz.open(stream=file_bytes, filetype="pdf")
```

**Respuesta JSON de GPT-4o:**
Pedir siempre `response_format={"type": "json_object"}` cuando se espere JSON estructurado.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation — Scaffold y configuración

Crear estructura de carpetas, dependencias, variables de entorno y schemas Pydantic.

### Phase 2: Servicios core

Implementar los cuatro servicios en orden de dependencia:
1. `extractor.py` (PyMuPDF + GPT-4o)
2. `embeddings.py` (Azure OpenAI embeddings)
3. `vector_store.py` (ChromaDB)
4. `contradictions.py` (similitud + LLM)

### Phase 3: Routers y orquestación

Conectar servicios con los endpoints FastAPI.

### Phase 4: Tests y validación

pytest para cada servicio con mocks de Azure OpenAI.

---

## STEP-BY-STEP TASKS

### TASK 1 — CREATE `backend/requirements.txt`

- **IMPLEMENT**: Lista de dependencias con versiones mínimas
- **CONTENT**:
```
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
python-multipart>=0.0.9
pymupdf>=1.23.0
openai>=1.30.0
chromadb>=0.4.24
python-dotenv>=1.0.0
pydantic>=2.6.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
httpx>=0.27.0
mypy>=1.9.0
ruff>=0.4.0
```
- **VALIDATE**: `pip install -r backend/requirements.txt`

---

### TASK 2 — CREATE `backend/.env.example`

- **IMPLEMENT**: Plantilla de variables de entorno sin credenciales reales
- **CONTENT**:
```
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_API_KEY=<your-api-key>
AZURE_OPENAI_DEPLOYMENT_EMBEDDINGS=text-embedding-3-small
AZURE_OPENAI_DEPLOYMENT_GPT4O=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-01
CHROMA_PERSIST_DIR=./chroma_db
MAX_FILES=5
MAX_FILE_SIZE_MB=20
SIMILARITY_THRESHOLD=0.75
```
- **GOTCHA**: Nunca subir `.env` real al repo. Añadir `.env` a `.gitignore`.
- **VALIDATE**: Verificar que `.env` está en `.gitignore`

---

### TASK 3 — CREATE `backend/models/schemas.py`

- **IMPLEMENT**: Todos los schemas Pydantic del sistema
- **SCHEMAS**:

```python
from pydantic import BaseModel
from typing import List, Optional

class Clause(BaseModel):
    id: str                  # uuid
    doc_id: str
    doc_name: str
    clause_number: str
    clause_title: str
    text: str
    page: int

class UploadedFile(BaseModel):
    name: str
    pages: int
    status: str              # "ok" | "error"

class UploadResponse(BaseModel):
    session_id: str
    files: List[UploadedFile]

class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str              # "processing" | "complete" | "error"

class GraphNode(BaseModel):
    id: str
    doc: str
    number: str
    title: str
    text: str

class GraphEdge(BaseModel):
    source: str
    target: str
    severity: int
    explanation: str

class Graph(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

class ReportEntry(BaseModel):
    clause_a: GraphNode
    clause_b: GraphNode
    explanation: str
    severity: int

class ResultsResponse(BaseModel):
    status: str
    graph: Graph
    report: List[ReportEntry]
```

- **VALIDATE**: `cd backend && python -c "from models.schemas import ResultsResponse; print('OK')"`

---

### TASK 4 — CREATE `backend/services/extractor.py`

- **IMPLEMENT**: Extraer texto de PDF con PyMuPDF y chunkearlo en cláusulas con GPT-4o
- **PATTERN**:

```python
import fitz  # PyMuPDF
import json
import uuid
import os
from openai import AzureOpenAI
from models.schemas import Clause

def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages_text = []
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text()
        if text.strip():
            pages_text.append(f"[PAGE {page_num}]\n{text}")
    return "\n\n".join(pages_text)

def chunk_into_clauses(text: str, doc_id: str, doc_name: str) -> list[Clause]:
    client = AzureOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
    )
    prompt = """You are a legal document parser. Extract all clauses from the following contract text.
Return a JSON object with a "clauses" array. Each clause must have:
- "number": clause identifier (e.g. "1", "2.1", "3.a")
- "title": clause title or heading (empty string if none)
- "text": complete clause body text
- "page": page number where the clause starts (use the [PAGE N] markers)

Rules:
- Keep each clause complete. Do not split a clause into multiple entries.
- Do not merge separate clauses into one entry.
- If a clause spans multiple pages, use the page where it starts.
- Ignore headers, footers, signatures, and table of contents.

Contract text:
""" + text

    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT_GPT4O", "gpt-4o"),
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0,
    )
    data = json.loads(response.choices[0].message.content)
    clauses = []
    for item in data.get("clauses", []):
        clauses.append(Clause(
            id=str(uuid.uuid4()),
            doc_id=doc_id,
            doc_name=doc_name,
            clause_number=item.get("number", ""),
            clause_title=item.get("title", ""),
            text=item.get("text", ""),
            page=item.get("page", 1),
        ))
    return clauses

def extract_clauses(file_bytes: bytes, doc_id: str, doc_name: str) -> list[Clause]:
    text = extract_text_from_pdf(file_bytes)
    return chunk_into_clauses(text, doc_id, doc_name)
```

- **GOTCHA**: PyMuPDF importa como `import fitz`, no `import pymupdf`.
- **GOTCHA**: `response_format={"type": "json_object"}` requiere que el prompt mencione explícitamente "JSON" — ya está incluido.
- **VALIDATE**: `cd backend && python -c "from services.extractor import extract_clauses; print('OK')"`

---

### TASK 5 — CREATE `backend/services/embeddings.py`

- **IMPLEMENT**: Generar embeddings para una lista de cláusulas

```python
import os
from openai import AzureOpenAI
from models.schemas import Clause

def get_azure_client() -> AzureOpenAI:
    return AzureOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
    )

def generate_embeddings(clauses: list[Clause]) -> list[list[float]]:
    client = get_azure_client()
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_EMBEDDINGS", "text-embedding-3-small")
    texts = [f"{c.clause_title}\n{c.text}" for c in clauses]
    response = client.embeddings.create(model=deployment, input=texts)
    return [item.embedding for item in response.data]
```

- **GOTCHA**: Azure OpenAI embeddings acepta lista de strings en `input`, no lista de objetos.
- **GOTCHA**: El texto combinado `title\ntext` mejora la calidad del embedding.
- **VALIDATE**: `cd backend && python -c "from services.embeddings import generate_embeddings; print('OK')"`

---

### TASK 6 — CREATE `backend/services/vector_store.py`

- **IMPLEMENT**: Operaciones ChromaDB — almacenar y consultar cláusulas

```python
import os
import chromadb
from models.schemas import Clause

def get_client() -> chromadb.PersistentClient:
    persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
    return chromadb.PersistentClient(path=persist_dir)

def get_or_create_collection(session_id: str):
    client = get_client()
    return client.get_or_create_collection(
        name=f"session_{session_id}",
        metadata={"hnsw:space": "cosine"},
    )

def store_clauses(session_id: str, clauses: list[Clause], embeddings: list[list[float]]) -> None:
    collection = get_or_create_collection(session_id)
    collection.add(
        ids=[c.id for c in clauses],
        embeddings=embeddings,
        documents=[c.text for c in clauses],
        metadatas=[{
            "doc_id": c.doc_id,
            "doc_name": c.doc_name,
            "clause_number": c.clause_number,
            "clause_title": c.clause_title,
            "page": c.page,
        } for c in clauses],
    )

def query_similar(session_id: str, embedding: list[float], exclude_doc_id: str, top_n: int = 10) -> list[dict]:
    collection = get_or_create_collection(session_id)
    results = collection.query(
        query_embeddings=[embedding],
        n_results=min(top_n, collection.count()),
        where={"doc_id": {"$ne": exclude_doc_id}},
    )
    similar = []
    for i, doc_id in enumerate(results["ids"][0]):
        similar.append({
            "id": doc_id,
            "text": results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
            "distance": results["distances"][0][i],
        })
    return similar

def delete_collection(session_id: str) -> None:
    client = get_client()
    try:
        client.delete_collection(f"session_{session_id}")
    except Exception:
        pass
```

- **GOTCHA**: `hnsw:space: cosine` usa distancia coseno (0 = idéntico, 2 = opuesto). Filtrar por distancia < (1 - SIMILARITY_THRESHOLD).
- **GOTCHA**: `n_results` no puede ser mayor que el número de documentos en la colección — usar `min(top_n, collection.count())`.
- **GOTCHA**: El filtro `where={"doc_id": {"$ne": exclude_doc_id}}` requiere que haya al menos un documento que no pertenezca al doc excluido.
- **VALIDATE**: `cd backend && python -c "from services.vector_store import get_client; print('OK')"`

---

### TASK 7 — CREATE `backend/services/contradictions.py`

- **IMPLEMENT**: Detectar contradicciones entre pares de cláusulas

```python
import os
import json
import uuid
from openai import AzureOpenAI
from models.schemas import Clause, GraphEdge, GraphNode, ReportEntry
from services.vector_store import query_similar
from services.embeddings import generate_embeddings

def get_azure_client() -> AzureOpenAI:
    return AzureOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
    )

def check_contradiction(clause_a: Clause, clause_b_text: str, clause_b_meta: dict) -> dict:
    client = get_azure_client()
    prompt = f"""You are a legal expert. Analyze whether these two clauses from different contracts are contradictory.

Clause A (from {clause_a.doc_name}, clause {clause_a.clause_number}):
{clause_a.text}

Clause B (from {clause_b_meta.get('doc_name', '')}, clause {clause_b_meta.get('clause_number', '')}):
{clause_b_text}

Return a JSON object with:
- "contradiction": true if the clauses contradict each other, false otherwise
- "explanation": a clear explanation of why they do or do not contradict (1-3 sentences)
- "severity": integer from 1 to 10 (only relevant if contradiction is true, else 0)

A contradiction exists when following both clauses simultaneously is impossible or creates a legal conflict.
"""
    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT_GPT4O", "gpt-4o"),
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0,
    )
    return json.loads(response.choices[0].message.content)

def detect_contradictions(session_id: str, clauses: list[Clause]) -> tuple[list[GraphEdge], list[ReportEntry]]:
    threshold = float(os.getenv("SIMILARITY_THRESHOLD", "0.75"))
    distance_threshold = 1 - threshold

    embeddings = generate_embeddings(clauses)
    clause_map = {c.id: c for c in clauses}

    checked_pairs: set[frozenset] = set()
    edges: list[GraphEdge] = []
    report: list[ReportEntry] = []

    for clause, embedding in zip(clauses, embeddings):
        similar = query_similar(session_id, embedding, exclude_doc_id=clause.doc_id)
        for candidate in similar:
            if candidate["distance"] > distance_threshold:
                continue
            pair = frozenset([clause.id, candidate["id"]])
            if pair in checked_pairs:
                continue
            checked_pairs.add(pair)

            result = check_contradiction(clause, candidate["text"], candidate["metadata"])
            if result.get("contradiction"):
                severity = int(result.get("severity", 5))
                explanation = result.get("explanation", "")

                node_a = GraphNode(
                    id=clause.id,
                    doc=clause.doc_name,
                    number=clause.clause_number,
                    title=clause.clause_title,
                    text=clause.text,
                )
                node_b = GraphNode(
                    id=candidate["id"],
                    doc=candidate["metadata"].get("doc_name", ""),
                    number=candidate["metadata"].get("clause_number", ""),
                    title=candidate["metadata"].get("clause_title", ""),
                    text=candidate["text"],
                )
                edges.append(GraphEdge(
                    source=clause.id,
                    target=candidate["id"],
                    severity=severity,
                    explanation=explanation,
                ))
                report.append(ReportEntry(
                    clause_a=node_a,
                    clause_b=node_b,
                    explanation=explanation,
                    severity=severity,
                ))

    report.sort(key=lambda x: x.severity, reverse=True)
    return edges, report
```

- **GOTCHA**: Distancia coseno en ChromaDB es `1 - similitud`, así que similitud > 0.75 equivale a distancia < 0.25.
- **GOTCHA**: `frozenset` para deduplicar pares bidireccionales (A-B == B-A).
- **GOTCHA**: `generate_embeddings` se llama dos veces (una en `store_clauses` y otra aquí). Optimización post-MVP: cachear embeddings en memoria durante el análisis.
- **VALIDATE**: `cd backend && python -c "from services.contradictions import detect_contradictions; print('OK')"`

---

### TASK 8 — CREATE `backend/main.py`

- **IMPLEMENT**: App FastAPI con CORS y registro de routers

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import upload, analysis, results

app = FastAPI(title="DeathClausule API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(analysis.router)
app.include_router(results.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- **GOTCHA**: `load_dotenv()` debe llamarse antes de importar los routers, porque los servicios leen variables de entorno al importarse.
- **VALIDATE**: `cd backend && uvicorn main:app --reload` → `curl http://localhost:8000/health`

---

### TASK 9 — CREATE `backend/routers/upload.py`

- **IMPLEMENT**: Endpoint POST `/upload` — recibe PDFs, extrae cláusulas, almacena en ChromaDB

```python
import uuid
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from models.schemas import UploadResponse, UploadedFile
from services.extractor import extract_clauses
from services.embeddings import generate_embeddings
from services.vector_store import store_clauses

router = APIRouter()

MAX_FILES = int(os.getenv("MAX_FILES", "5"))
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "20"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

@router.post("/upload", response_model=UploadResponse)
async def upload_files(files: List[UploadFile] = File(...)):
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_FILES} files allowed")

    session_id = str(uuid.uuid4())
    uploaded = []
    all_clauses = []

    for file in files:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF")
        
        content = await file.read()
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=400, detail=f"{file.filename} exceeds {MAX_FILE_SIZE_MB}MB limit")

        doc_id = str(uuid.uuid4())
        clauses = extract_clauses(content, doc_id, file.filename)
        
        import fitz
        doc = fitz.open(stream=content, filetype="pdf")
        pages = len(doc)
        doc.close()

        all_clauses.extend(clauses)
        uploaded.append(UploadedFile(name=file.filename, pages=pages, status="ok"))

    if all_clauses:
        embeddings = generate_embeddings(all_clauses)
        store_clauses(session_id, all_clauses, embeddings)

    return UploadResponse(session_id=session_id, files=uploaded)
```

- **GOTCHA**: `await file.read()` consume el stream. No se puede leer dos veces sin resetear.
- **GOTCHA**: El `fitz.open` para contar páginas debe hacerse sobre los bytes ya leídos, no re-leer el stream.
- **VALIDATE**: `curl -X POST http://localhost:8000/upload -F "files=@test.pdf"`

---

### TASK 10 — CREATE `backend/routers/analysis.py`

- **IMPLEMENT**: Endpoint POST `/analyze/{session_id}` — ejecuta detección de contradicciones

```python
import uuid
from fastapi import APIRouter, HTTPException
from models.schemas import AnalysisResponse
from services.vector_store import get_or_create_collection
from services.contradictions import detect_contradictions
from models.schemas import Clause, Graph, GraphNode, ResultsResponse

router = APIRouter()

# Almacenamiento en memoria para el MVP (stateless entre reinicios)
analysis_store: dict = {}

@router.post("/analyze/{session_id}", response_model=AnalysisResponse)
def analyze(session_id: str):
    collection = get_or_create_collection(session_id)
    if collection.count() == 0:
        raise HTTPException(status_code=404, detail="Session not found or empty")

    # Reconstruir cláusulas desde ChromaDB
    all_docs = collection.get(include=["documents", "metadatas"])
    clauses = []
    for i, doc_id in enumerate(all_docs["ids"]):
        meta = all_docs["metadatas"][i]
        clauses.append(Clause(
            id=doc_id,
            doc_id=meta["doc_id"],
            doc_name=meta["doc_name"],
            clause_number=meta["clause_number"],
            clause_title=meta["clause_title"],
            text=all_docs["documents"][i],
            page=meta["page"],
        ))

    edges, report = detect_contradictions(session_id, clauses)

    nodes = {c.id: GraphNode(
        id=c.id,
        doc=c.doc_name,
        number=c.clause_number,
        title=c.clause_title,
        text=c.text,
    ) for c in clauses}

    # Solo incluir nodos que aparecen en alguna arista
    node_ids = {e.source for e in edges} | {e.target for e in edges}
    graph_nodes = [nodes[nid] for nid in node_ids if nid in nodes]

    analysis_id = str(uuid.uuid4())
    analysis_store[analysis_id] = ResultsResponse(
        status="complete",
        graph=Graph(nodes=graph_nodes, edges=edges),
        report=report,
    )

    return AnalysisResponse(analysis_id=analysis_id, status="complete")
```

- **GOTCHA**: `analysis_store` es in-memory — se pierde al reiniciar el servidor. Suficiente para MVP/demo.
- **VALIDATE**: `curl -X POST http://localhost:8000/analyze/<session_id>`

---

### TASK 11 — CREATE `backend/routers/results.py`

- **IMPLEMENT**: Endpoint GET `/results/{analysis_id}`

```python
from fastapi import APIRouter, HTTPException
from models.schemas import ResultsResponse
from routers.analysis import analysis_store

router = APIRouter()

@router.get("/results/{analysis_id}", response_model=ResultsResponse)
def get_results(analysis_id: str):
    result = analysis_store.get(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return result
```

- **GOTCHA**: Importar `analysis_store` desde `routers.analysis` crea dependencia circular si `analysis.py` importa de `results.py`. Mantenerlo unidireccional.
- **VALIDATE**: `curl http://localhost:8000/results/<analysis_id>`

---

### TASK 12 — CREATE `backend/tests/conftest.py` y tests unitarios

- **IMPLEMENT**: Fixtures y tests con mocks de Azure OpenAI y ChromaDB

```python
# conftest.py
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

@pytest.fixture
def client():
    from main import app
    return TestClient(app)

@pytest.fixture
def mock_azure_client():
    with patch("openai.AzureOpenAI") as mock:
        yield mock
```

**test_extractor.py** — verificar que `extract_clauses` devuelve lista de `Clause` con campos correctos (mock GPT-4o response).

**test_embeddings.py** — verificar que `generate_embeddings` devuelve lista de listas de floats (mock embeddings response).

**test_vector_store.py** — usar ChromaDB en memoria (`chromadb.EphemeralClient`) para test sin persistencia.

**test_contradictions.py** — verificar deduplicación de pares y filtrado por threshold.

- **VALIDATE**: `cd backend && pytest -v`

---

## TESTING STRATEGY

### Unit Tests
- Cada servicio con mock de dependencias externas (Azure OpenAI, ChromaDB).
- Verificar schemas Pydantic con datos de ejemplo.

### Integration Tests
- `TestClient` de FastAPI para el flujo completo `/upload` → `/analyze` → `/results` con un PDF real pequeño.

### Edge Cases
- PDF sin texto extraíble (solo imágenes).
- Un solo documento subido (sin contradicciones posibles entre docs distintos).
- Cláusulas muy largas (> 4000 tokens).
- ChromaDB colección vacía al llamar `/analyze`.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
cd backend
ruff check .
mypy . --ignore-missing-imports
```

### Level 2: Unit Tests
```bash
cd backend
pytest tests/ -v
```

### Level 3: Integration manual
```bash
# Terminal 1
cd backend && uvicorn main:app --reload

# Terminal 2
curl http://localhost:8000/health
curl -X POST http://localhost:8000/upload -F "files=@sample.pdf" -F "files=@sample2.pdf"
# Usar session_id del response anterior
curl -X POST http://localhost:8000/analyze/<session_id>
curl http://localhost:8000/results/<analysis_id>
```

---

## ACCEPTANCE CRITERIA

- [ ] `pip install -r requirements.txt` completa sin errores
- [ ] `uvicorn main:app --reload` arranca sin errores
- [ ] `GET /health` devuelve `{"status": "ok"}`
- [ ] `POST /upload` con 2 PDFs devuelve `session_id` y lista de archivos
- [ ] `POST /analyze/{session_id}` devuelve `analysis_id`
- [ ] `GET /results/{analysis_id}` devuelve grafo + informe con al menos una contradicción detectada en PDFs de prueba
- [ ] `ruff check .` sin errores
- [ ] `mypy . --ignore-missing-imports` sin errores
- [ ] `pytest -v` todos los tests pasan

---

## COMPLETION CHECKLIST

- [ ] Todos los archivos creados en el orden indicado
- [ ] Cada VALIDATE ejecutado tras cada tarea
- [ ] `ruff` y `mypy` pasan
- [ ] `pytest` pasa
- [ ] Demo manual con PDFs reales funciona

---

## NOTES

- **Segunda llamada a embeddings en `contradictions.py`**: En el MVP se generan embeddings dos veces (una al hacer upload, otra al detectar contradicciones). Es ineficiente pero correcto. La optimización (cachear en memoria o leerlos de ChromaDB) queda para post-MVP.
- **Stateless**: El `analysis_store` in-memory es intencional para MVP. No hay base de datos persistente de resultados.
- **Sin agentes**: Todo el pipeline es secuencial y determinista. GPT-4o se usa dos veces de forma puntual (chunking + veredicto), no como agente autónomo.
- **Confidence Score**: 8/10 — el plan cubre todos los gotchas conocidos. El riesgo principal es la calidad del prompt de chunking con PDFs legales reales, que requiere ajuste manual.
