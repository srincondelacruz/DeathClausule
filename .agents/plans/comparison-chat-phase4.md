# Feature: Comparación de Contratos + Chat — Fase 4

The following plan should be complete, but validate documentation and codebase patterns before implementing.
This feature extends the existing backend and frontend without breaking the existing contradiction detection flow.

## Feature Description

Nueva funcionalidad de **comparación de dos contratos** con tres outputs:
1. **Cláusulas exclusivas**: qué cláusulas hay en cada documento que no tienen equivalente en el otro.
2. **Cláusulas similares con diferencias**: pares de cláusulas semánticamente relacionadas entre los dos docs, con un diff textual explicado.
3. **Resumen ejecutivo**: párrafo generado por GPT-4o resumiendo las diferencias principales entre los dos contratos.

Además, un **chat RAG** sobre ambos contratos donde el usuario puede hacer preguntas y el sistema responde basándose en el contenido de los dos documentos. El chat también puede generar recomendaciones de cláusulas unificadas cuando se le pide.

## User Story

As a legal professional,
I want to upload two contracts and get a structured comparison plus a chat interface,
So that I can understand their differences quickly and get AI-generated clause recommendations.

## Problem Statement

La funcionalidad actual detecta contradicciones pero no ofrece una vista comparativa estructurada ni permite al usuario explorar el contenido de los contratos libremente mediante preguntas.

## Solution Statement

- Reutilizar el pipeline existente (extracción + embeddings + ChromaDB) para no duplicar código.
- Añadir un nuevo endpoint `/compare/{session_id}` que genera la comparativa.
- Añadir endpoints de chat: `POST /chat/{session_id}` (streaming o síncrono).
- En el frontend, añadir una segunda pestaña "Compare" en la vista de resultados.

## Feature Metadata

**Feature Type**: New Capability  
**Estimated Complexity**: High  
**Primary Systems Affected**: backend/services, backend/routers, frontend/components  
**Dependencies**: Ninguna nueva — reutiliza openai, chromadb, fastapi ya instalados

---

## CONTEXT REFERENCES

### Relevant Codebase Files — LEER ANTES DE IMPLEMENTAR

- `backend/models/schemas.py` — schemas existentes. Añadir los nuevos sin tocar los existentes.
- `backend/services/vector_store.py` — `get_or_create_collection`, `store_clauses`, `query_similar`. Reutilizar directamente.
- `backend/services/embeddings.py` — `generate_embeddings`. Reutilizar directamente.
- `backend/services/extractor.py` — `extract_clauses`. Reutilizar directamente.
- `backend/routers/upload.py` — patrón de router existente a seguir.
- `backend/routers/analysis.py` — `analysis_store` dict in-memory. El chat store seguirá el mismo patrón.
- `backend/main.py` — registro de routers. Añadir los dos nuevos routers aquí.
- `frontend/src/types/api.ts` — tipos existentes. Añadir los nuevos sin tocar los existentes.
- `frontend/src/App.tsx` — orquestador principal. Añadir pestaña "Compare" en la vista `complete`.
- `frontend/src/hooks/useAnalysis.ts` — hook existente. Añadir `useComparison` como hook separado.

### New Files to Create

```
backend/
├── routers/
│   ├── comparison.py        # POST /compare/{session_id}
│   └── chat.py              # POST /chat/{session_id}
├── services/
│   └── comparison.py        # Lógica de comparación y chat RAG

frontend/src/
├── components/
│   ├── Comparison/
│   │   ├── ComparisonPanel.tsx      # Contenedor de las 3 secciones
│   │   ├── ExclusiveClauses.tsx     # Cláusulas exclusivas de cada doc
│   │   ├── SimilarClauses.tsx       # Pares similares con diferencias
│   │   └── ExecutiveSummary.tsx     # Resumen ejecutivo
│   └── Chat/
│       ├── ChatPanel.tsx            # Contenedor del chat
│       ├── ChatMessage.tsx          # Burbuja de mensaje individual
│       └── ChatInput.tsx            # Input + botón enviar
├── hooks/
│   └── useComparison.ts             # Hook para comparación + chat
```

### Patterns to Follow

**Router pattern** (copiar de `backend/routers/upload.py`):
```python
from fastapi import APIRouter
router = APIRouter()

@router.post("/compare/{session_id}", response_model=ComparisonResponse)
def compare(session_id: str): ...
```

**In-memory store pattern** (copiar de `backend/routers/analysis.py`):
```python
comparison_store: dict = {}
chat_store: dict = {}  # session_id → List[ChatMessage]
```

**Azure OpenAI client** (copiar de `backend/services/embeddings.py`):
```python
from openai import AzureOpenAI
client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
)
```

**Separación componente/lógica** (patrón Fase 2):
- Componentes solo renderizan props.
- Toda la lógica de red en hooks (`useComparison`).
- Funciones de API en `frontend/src/api/client.ts` (añadir, no reemplazar).

---

## IMPLEMENTATION PLAN

### Phase 1: Schemas nuevos (backend)
Añadir tipos de comparación y chat a `schemas.py` sin tocar los existentes.

### Phase 2: Servicio de comparación (backend)
`services/comparison.py` con tres funciones: cláusulas exclusivas, pares similares con diff, resumen ejecutivo, y función de chat RAG.

### Phase 3: Routers (backend)
`routers/comparison.py` y `routers/chat.py`. Registrarlos en `main.py`.

### Phase 4: Tipos y API client (frontend)
Añadir tipos nuevos a `api.ts` y funciones nuevas a `client.ts`.

### Phase 5: Hook `useComparison`
Orquesta llamadas a `/compare` y `/chat`.

### Phase 6: Componentes de comparación y chat
Implementar todos los componentes nuevos.

### Phase 7: Integrar en `App.tsx`
Añadir pestañas "Contradictions / Comparison / Chat" en la vista `complete`.

---

## STEP-BY-STEP TASKS

### TASK 1 — UPDATE `backend/models/schemas.py`

- **IMPLEMENT**: Añadir al final del archivo los nuevos schemas. No modificar los existentes.

```python
# --- Comparison schemas ---

class ExclusiveClause(BaseModel):
    clause: GraphNode
    doc: str  # nombre del documento al que pertenece

class SimilarPair(BaseModel):
    clause_a: GraphNode
    clause_b: GraphNode
    similarity_score: float
    differences: str  # explicación en lenguaje natural de las diferencias

class ComparisonResponse(BaseModel):
    doc_a: str                          # nombre del primer documento
    doc_b: str                          # nombre del segundo documento
    exclusive_a: List[GraphNode]        # cláusulas solo en doc_a
    exclusive_b: List[GraphNode]        # cláusulas solo en doc_b
    similar_pairs: List[SimilarPair]    # pares similares con diferencias
    executive_summary: str              # resumen ejecutivo generado por GPT-4o

# --- Chat schemas ---

class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    sources: List[GraphNode]  # cláusulas usadas como contexto RAG
```

- **VALIDATE**: `cd backend && python -c "from models.schemas import ComparisonResponse, ChatResponse; print('OK')"`

---

### TASK 2 — CREATE `backend/services/comparison.py`

- **IMPLEMENT**: Cuatro funciones: exclusivas, similares, resumen ejecutivo, chat RAG

```python
import os
import json
from openai import AzureOpenAI
from models.schemas import (
    Clause, GraphNode, SimilarPair,
    ComparisonResponse, ChatMessage
)
from services.vector_store import get_or_create_collection, query_similar
from services.embeddings import generate_embeddings


def get_azure_client() -> AzureOpenAI:
    return AzureOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
    )


def _clause_to_node(c: Clause) -> GraphNode:
    return GraphNode(
        id=c.id,
        doc=c.doc_name,
        number=c.clause_number,
        title=c.clause_title,
        text=c.text,
    )


def find_exclusive_and_similar(
    session_id: str,
    clauses_a: list[Clause],
    clauses_b: list[Clause],
) -> tuple[list[GraphNode], list[GraphNode], list[SimilarPair]]:
    """
    Devuelve (exclusive_a, exclusive_b, similar_pairs).
    Una cláusula es 'exclusiva' si no tiene ningún par con similitud >= MATCH_THRESHOLD
    en el otro documento.
    """
    MATCH_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.75"))
    distance_threshold = 1 - MATCH_THRESHOLD

    embeddings_a = generate_embeddings(clauses_a)
    matched_a: set[str] = set()
    matched_b: set[str] = set()
    similar_pairs: list[SimilarPair] = []
    checked_pairs: set[frozenset] = set()

    client = get_azure_client()

    for clause, embedding in zip(clauses_a, embeddings_a):
        candidates = query_similar(session_id, embedding, exclude_doc_id=clause.doc_id, top_n=3)
        for candidate in candidates:
            if candidate["distance"] > distance_threshold:
                continue
            pair = frozenset([clause.id, candidate["id"]])
            if pair in checked_pairs:
                continue
            checked_pairs.add(pair)
            matched_a.add(clause.id)
            matched_b.add(candidate["id"])

            # Pedir diferencias a GPT-4o
            prompt = f"""Compare these two contract clauses and explain their differences concisely (2-3 sentences).
Focus on what each clause says differently, not on their similarities.

Clause A ({clause.doc_name}, {clause.clause_number}):
{clause.text}

Clause B ({candidate['metadata'].get('doc_name', '')}, {candidate['metadata'].get('clause_number', '')}):
{candidate['text']}

Return a JSON object with:
- "differences": explanation of how they differ
"""
            response = client.chat.completions.create(
                model=os.getenv("AZURE_OPENAI_DEPLOYMENT_GPT4O", "gpt-4o"),
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0,
            )
            result = json.loads(response.choices[0].message.content)
            b_meta = candidate["metadata"]
            similar_pairs.append(SimilarPair(
                clause_a=_clause_to_node(clause),
                clause_b=GraphNode(
                    id=candidate["id"],
                    doc=b_meta.get("doc_name", ""),
                    number=b_meta.get("clause_number", ""),
                    title=b_meta.get("clause_title", ""),
                    text=candidate["text"],
                ),
                similarity_score=round(1 - candidate["distance"], 3),
                differences=result.get("differences", ""),
            ))

    exclusive_a = [_clause_to_node(c) for c in clauses_a if c.id not in matched_a]
    exclusive_b = [_clause_to_node(c) for c in clauses_b if c.id not in matched_b]
    return exclusive_a, exclusive_b, similar_pairs


def generate_executive_summary(
    doc_a: str,
    doc_b: str,
    exclusive_a: list[GraphNode],
    exclusive_b: list[GraphNode],
    similar_pairs: list[SimilarPair],
) -> str:
    client = get_azure_client()
    exclusive_a_text = "\n".join(f"- [{c.number}] {c.title}: {c.text[:200]}..." for c in exclusive_a[:5])
    exclusive_b_text = "\n".join(f"- [{c.number}] {c.title}: {c.text[:200]}..." for c in exclusive_b[:5])
    diffs_text = "\n".join(f"- {p.differences}" for p in similar_pairs[:5])

    prompt = f"""You are a legal analyst. Write a concise executive summary (3-5 paragraphs) comparing two contracts.

Document A: {doc_a}
Document B: {doc_b}

Clauses only in {doc_a}:
{exclusive_a_text or 'None'}

Clauses only in {doc_b}:
{exclusive_b_text or 'None'}

Key differences in shared clauses:
{diffs_text or 'None'}

Write the summary in the same language as the contract clauses above.
Focus on: overall scope differences, key missing protections, notable conflicts, and practical implications.
"""
    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT_GPT4O", "gpt-4o"),
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    return response.choices[0].message.content or ""


def compare_contracts(
    session_id: str,
    clauses_a: list[Clause],
    clauses_b: list[Clause],
) -> ComparisonResponse:
    doc_a = clauses_a[0].doc_name if clauses_a else "Document A"
    doc_b = clauses_b[0].doc_name if clauses_b else "Document B"

    exclusive_a, exclusive_b, similar_pairs = find_exclusive_and_similar(
        session_id, clauses_a, clauses_b
    )
    summary = generate_executive_summary(doc_a, doc_b, exclusive_a, exclusive_b, similar_pairs)

    return ComparisonResponse(
        doc_a=doc_a,
        doc_b=doc_b,
        exclusive_a=exclusive_a,
        exclusive_b=exclusive_b,
        similar_pairs=similar_pairs,
        executive_summary=summary,
    )


def chat_with_contracts(
    session_id: str,
    message: str,
    history: list[ChatMessage],
) -> tuple[str, list[GraphNode]]:
    """
    RAG chat: recupera cláusulas relevantes de ChromaDB y genera respuesta con GPT-4o.
    Devuelve (reply, sources).
    """
    client = get_azure_client()

    # Generar embedding de la pregunta
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_EMBEDDINGS", "text-embedding-3-small")
    embed_response = client.embeddings.create(model=deployment, input=[message])
    query_embedding = embed_response.data[0].embedding

    # Recuperar cláusulas relevantes de ambos documentos (sin filtro de doc_id)
    collection = get_or_create_collection(session_id)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(6, collection.count()),
    )

    sources: list[GraphNode] = []
    context_parts: list[str] = []
    for i, doc_id in enumerate(results["ids"][0]):
        meta = results["metadatas"][0][i]
        text = results["documents"][0][i]
        sources.append(GraphNode(
            id=doc_id,
            doc=meta.get("doc_name", ""),
            number=meta.get("clause_number", ""),
            title=meta.get("clause_title", ""),
            text=text,
        ))
        context_parts.append(
            f"[{meta.get('doc_name', '')} — Clause {meta.get('clause_number', '')}]\n{text}"
        )

    context = "\n\n---\n\n".join(context_parts)
    system_prompt = f"""You are a legal assistant specialized in contract analysis.
Answer questions based ONLY on the contract clauses provided below.
If asked to draft a recommendation or unified clause, do so based on both contracts.
Always cite which document and clause number you're referring to.
Respond in the same language as the user's question.

Contract clauses:
{context}
"""
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-6:]:  # últimos 6 mensajes para no exceder contexto
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT_GPT4O", "gpt-4o"),
        messages=messages,
        temperature=0.3,
    )
    reply = response.choices[0].message.content or ""
    return reply, sources
```

- **GOTCHA**: `query_similar` filtra por `doc_id != exclude_doc_id`. Para el chat RAG queremos cláusulas de ambos docs — usar `collection.query()` directamente sin filtro.
- **GOTCHA**: El historial del chat se trunca a los últimos 6 mensajes para no exceder el límite de tokens de GPT-4o.
- **GOTCHA**: `generate_embeddings` acepta `list[Clause]`. Para el chat la pregunta es un string — usar `client.embeddings.create` directamente.
- **VALIDATE**: `cd backend && python -c "from services.comparison import compare_contracts; print('OK')"`

---

### TASK 3 — CREATE `backend/routers/comparison.py`

- **IMPLEMENT**: Endpoint `POST /compare/{session_id}`

```python
from fastapi import APIRouter, HTTPException
from models.schemas import ComparisonResponse, Clause
from services.vector_store import get_or_create_collection
from services.comparison import compare_contracts

router = APIRouter()
comparison_store: dict = {}


@router.post("/compare/{session_id}", response_model=ComparisonResponse)
def compare(session_id: str):
    collection = get_or_create_collection(session_id)
    if collection.count() == 0:
        raise HTTPException(status_code=404, detail="Session not found or empty")

    all_docs = collection.get(include=["documents", "metadatas"])
    clauses: list[Clause] = []
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

    # Separar cláusulas por documento
    doc_ids = list(dict.fromkeys(c.doc_id for c in clauses))
    if len(doc_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 documents required for comparison")

    clauses_a = [c for c in clauses if c.doc_id == doc_ids[0]]
    clauses_b = [c for c in clauses if c.doc_id == doc_ids[1]]

    result = compare_contracts(session_id, clauses_a, clauses_b)
    comparison_store[session_id] = result
    return result
```

- **GOTCHA**: `dict.fromkeys` preserva el orden de inserción en Python 3.7+ — los doc_ids quedan en el orden en que se subieron los archivos.
- **VALIDATE**: `cd backend && python -c "from routers.comparison import router; print('OK')"`

---

### TASK 4 — CREATE `backend/routers/chat.py`

- **IMPLEMENT**: Endpoint `POST /chat/{session_id}` con historial in-memory

```python
from fastapi import APIRouter, HTTPException
from models.schemas import ChatRequest, ChatResponse, ChatMessage
from services.vector_store import get_or_create_collection
from services.comparison import chat_with_contracts

router = APIRouter()
chat_store: dict[str, list[ChatMessage]] = {}


@router.post("/chat/{session_id}", response_model=ChatResponse)
def chat(session_id: str, request: ChatRequest):
    collection = get_or_create_collection(session_id)
    if collection.count() == 0:
        raise HTTPException(status_code=404, detail="Session not found or empty")

    history = chat_store.get(session_id, [])
    reply, sources = chat_with_contracts(session_id, request.message, history)

    # Actualizar historial
    history.append(ChatMessage(role="user", content=request.message))
    history.append(ChatMessage(role="assistant", content=reply))
    chat_store[session_id] = history

    return ChatResponse(reply=reply, sources=sources)
```

- **GOTCHA**: El `session_id` en la URL y en el `ChatRequest` body deben coincidir. Usar solo el de la URL.
- **VALIDATE**: `cd backend && python -c "from routers.chat import router; print('OK')"`

---

### TASK 5 — UPDATE `backend/main.py`

- **IMPLEMENT**: Registrar los dos nuevos routers

```python
# Añadir estos imports junto a los existentes:
from routers import comparison, chat

# Añadir estas líneas junto a los include_router existentes:
app.include_router(comparison.router)
app.include_router(chat.router)
```

- **VALIDATE**: `uvicorn main:app --reload` arranca sin errores → `curl http://localhost:8000/health`

---

### TASK 6 — UPDATE `frontend/src/types/api.ts`

- **IMPLEMENT**: Añadir al final los tipos nuevos sin tocar los existentes

```ts
// --- Comparison types ---

export interface SimilarPair {
  clause_a: GraphNode
  clause_b: GraphNode
  similarity_score: number
  differences: string
}

export interface ComparisonResponse {
  doc_a: string
  doc_b: string
  exclusive_a: GraphNode[]
  exclusive_b: GraphNode[]
  similar_pairs: SimilarPair[]
  executive_summary: string
}

// --- Chat types ---

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  session_id: string
  message: string
}

export interface ChatResponse {
  reply: string
  sources: GraphNode[]
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 7 — UPDATE `frontend/src/api/client.ts`

- **IMPLEMENT**: Añadir las dos nuevas funciones al final del archivo

```ts
import type { ComparisonResponse, ChatRequest, ChatResponse } from '../types/api'

export async function compareContracts(sessionId: string): Promise<ComparisonResponse> {
  const { data } = await api.post<ComparisonResponse>(`/compare/${sessionId}`)
  return data
}

export async function sendChatMessage(sessionId: string, message: string): Promise<ChatResponse> {
  const payload: ChatRequest = { session_id: sessionId, message }
  const { data } = await api.post<ChatResponse>(`/chat/${sessionId}`, payload)
  return data
}
```

- **GOTCHA**: Añadir también el proxy en `vite.config.ts`:
```ts
'/compare': 'http://localhost:8000',
'/chat': 'http://localhost:8000',
```
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 8 — CREATE `frontend/src/hooks/useComparison.ts`

- **IMPLEMENT**: Hook que gestiona comparación y chat

```ts
import { useState, useCallback } from 'react'
import { compareContracts, sendChatMessage } from '../api/client'
import type { ComparisonResponse, ChatMessage } from '../types/api'

interface State {
  comparison: ComparisonResponse | null
  messages: ChatMessage[]
  loadingComparison: boolean
  loadingChat: boolean
  error: string | null
}

export function useComparison(sessionId: string | null) {
  const [state, setState] = useState<State>({
    comparison: null,
    messages: [],
    loadingComparison: false,
    loadingChat: false,
    error: null,
  })

  const runComparison = useCallback(async () => {
    if (!sessionId) return
    setState(s => ({ ...s, loadingComparison: true, error: null }))
    try {
      const result = await compareContracts(sessionId)
      setState(s => ({ ...s, comparison: result, loadingComparison: false }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setState(s => ({ ...s, error: message, loadingComparison: false }))
    }
  }, [sessionId])

  const sendMessage = useCallback(async (message: string) => {
    if (!sessionId) return
    setState(s => ({
      ...s,
      messages: [...s.messages, { role: 'user', content: message }],
      loadingChat: true,
    }))
    try {
      const response = await sendChatMessage(sessionId, message)
      setState(s => ({
        ...s,
        messages: [...s.messages, { role: 'assistant', content: response.reply }],
        loadingChat: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setState(s => ({ ...s, error: message, loadingChat: false }))
    }
  }, [sessionId])

  return { ...state, runComparison, sendMessage }
}
```

- **GOTCHA**: `sessionId` viene de `useAnalysis` — pasarlo como prop al hook, no leerlo de ningún store global.
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 9 — CREATE componentes de comparación

**`frontend/src/components/Comparison/ExecutiveSummary.tsx`**
```tsx
interface Props { summary: string; docA: string; docB: string }

export default function ExecutiveSummary({ summary, docA, docB }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">Executive Summary</h3>
      <p className="text-xs text-gray-500">{docA} vs {docB}</p>
      <p className="text-sm leading-relaxed whitespace-pre-line">{summary}</p>
    </div>
  )
}
```

**`frontend/src/components/Comparison/ExclusiveClauses.tsx`**
```tsx
import type { GraphNode } from '../../types/api'

interface Props { clauses: GraphNode[]; docName: string }

export default function ExclusiveClauses({ clauses, docName }: Props) {
  if (clauses.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-medium text-sm">Only in {docName} ({clauses.length})</h4>
      <ul className="flex flex-col gap-2">
        {clauses.map(c => (
          <li key={c.id} className="border rounded p-3 text-sm">
            <p className="font-medium">Clause {c.number}{c.title ? ` — ${c.title}` : ''}</p>
            <p className="text-gray-600 mt-1 line-clamp-3">{c.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**`frontend/src/components/Comparison/SimilarClauses.tsx`**
```tsx
import type { SimilarPair } from '../../types/api'

interface Props { pairs: SimilarPair[] }

export default function SimilarClauses({ pairs }: Props) {
  if (pairs.length === 0) return <p className="text-sm text-gray-400">No similar clauses found.</p>
  return (
    <div className="flex flex-col gap-4">
      {pairs.map((pair, i) => (
        <div key={i} className="border rounded-lg p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Similar pair #{i + 1}
            </span>
            <span className="text-xs px-2 py-1 rounded border">
              {Math.round(pair.similarity_score * 100)}% similar
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500">{pair.clause_a.doc} · {pair.clause_a.number}</p>
              <p className="text-sm mt-1">{pair.clause_a.text}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">{pair.clause_b.doc} · {pair.clause_b.number}</p>
              <p className="text-sm mt-1">{pair.clause_b.text}</p>
            </div>
          </div>
          <div className="border-t pt-3 text-sm italic text-gray-600">
            {pair.differences}
          </div>
        </div>
      ))}
    </div>
  )
}
```

**`frontend/src/components/Comparison/ComparisonPanel.tsx`**
```tsx
import type { ComparisonResponse } from '../../types/api'
import ExecutiveSummary from './ExecutiveSummary'
import ExclusiveClauses from './ExclusiveClauses'
import SimilarClauses from './SimilarClauses'

interface Props {
  comparison: ComparisonResponse | null
  loading: boolean
  onRun: () => void
}

export default function ComparisonPanel({ comparison, loading, onRun }: Props) {
  if (!comparison && !loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-gray-500">Run a comparison to see how the two contracts differ.</p>
        <button onClick={onRun} className="px-4 py-2 rounded border font-medium">
          Compare Contracts
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">Comparing contracts...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <ExecutiveSummary
        summary={comparison!.executive_summary}
        docA={comparison!.doc_a}
        docB={comparison!.doc_b}
      />
      <div className="grid grid-cols-2 gap-6">
        <ExclusiveClauses clauses={comparison!.exclusive_a} docName={comparison!.doc_a} />
        <ExclusiveClauses clauses={comparison!.exclusive_b} docName={comparison!.doc_b} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold">Similar Clauses with Differences</h3>
        <SimilarClauses pairs={comparison!.similar_pairs} />
      </div>
    </div>
  )
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 10 — CREATE componentes de chat

**`frontend/src/components/Chat/ChatMessage.tsx`**
```tsx
import type { ChatMessage as ChatMessageType } from '../../types/api'

interface Props { message: ChatMessageType }

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
        isUser ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <p className="whitespace-pre-line">{message.content}</p>
      </div>
    </div>
  )
}
```

**`frontend/src/components/Chat/ChatInput.tsx`**
```tsx
import { useState, KeyboardEvent } from 'react'

interface Props {
  onSend: (message: string) => void
  disabled: boolean
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-2 items-end border rounded-lg p-2">
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={2}
        placeholder="Ask about the contracts... (Enter to send, Shift+Enter for new line)"
        className="flex-1 resize-none text-sm outline-none bg-transparent"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
      >
        Send
      </button>
    </div>
  )
}
```

**`frontend/src/components/Chat/ChatPanel.tsx`**
```tsx
import { useEffect, useRef } from 'react'
import type { ChatMessage as ChatMessageType } from '../../types/api'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

interface Props {
  messages: ChatMessageType[]
  loading: boolean
  onSend: (message: string) => void
}

export default function ChatPanel({ messages, loading, onSend }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 min-h-64 max-h-96 overflow-y-auto p-2">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            Ask anything about the contracts. You can also request clause recommendations.
          </p>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-400">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={onSend} disabled={loading} />
    </div>
  )
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 11 — UPDATE `frontend/src/App.tsx`

- **IMPLEMENT**: Añadir sistema de pestañas en la vista `complete` con tres tabs: Contradictions, Comparison, Chat

```tsx
// Añadir imports al inicio:
import { useState } from 'react'
import ComparisonPanel from './components/Comparison/ComparisonPanel'
import ChatPanel from './components/Chat/ChatPanel'
import { useComparison } from './hooks/useComparison'

// Dentro del componente App, añadir después de const { step, results, error, run, reset } = useAnalysis():
const [activeTab, setActiveTab] = useState<'contradictions' | 'comparison' | 'chat'>('contradictions')
const [sessionId, setSessionId] = useState<string | null>(null)
const { comparison, loadingComparison, messages, loadingChat, runComparison, sendMessage } = useComparison(sessionId)
```

- **GOTCHA**: `sessionId` debe guardarse cuando el upload termina. Modificar `useAnalysis` para exponerlo, o guardarlo en `App.tsx` pasando un callback a `run`.

La forma más limpia sin modificar `useAnalysis`: modificar el hook para exponer `sessionId`:
```ts
// En useAnalysis.ts, añadir sessionId al State:
interface State {
  step: Step
  sessionId: string | null   // ← añadir
  uploadedFiles: UploadedFile[]
  results: ResultsResponse | null
  error: string | null
}
// En UPLOAD_DONE action:
case 'UPLOAD_DONE': return { ...state, step: 'analyzing', sessionId: action.sessionId, uploadedFiles: action.files }
// En START_UPLOAD / RESET limpiar sessionId: null
// En run(), tras uploadFiles():
dispatch({ type: 'UPLOAD_DONE', files: uploadRes.files, sessionId: uploadRes.session_id })
// Exponer en el return del hook:
return { ...state, run, reset }  // sessionId ya viene del spread
```

- **IMPLEMENT**: En la vista `complete`, reemplazar el contenido con el sistema de pestañas:

```tsx
{step === 'complete' && results && (
  <div className="flex flex-col gap-6">
    {/* Tabs */}
    <div className="flex border-b">
      {(['contradictions', 'comparison', 'chat'] as const).map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px ${
            activeTab === tab ? 'border-gray-900' : 'border-transparent text-gray-500'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>

    {activeTab === 'contradictions' && (
      <>
        <GraphPlaceholder graph={results.graph} />
        <ReportPanel entries={results.report} />
      </>
    )}

    {activeTab === 'comparison' && (
      <ComparisonPanel
        comparison={comparison}
        loading={loadingComparison}
        onRun={runComparison}
      />
    )}

    {activeTab === 'chat' && (
      <ChatPanel
        messages={messages}
        loading={loadingChat}
        onSend={sendMessage}
      />
    )}

    <button onClick={reset} className="px-4 py-2 rounded border w-fit">
      Analyze new documents
    </button>
  </div>
)}
```

- **VALIDATE**: `npx tsc --noEmit` && `npm run build`

---

## TESTING STRATEGY

### TypeScript
`npx tsc --noEmit` tras cada tarea.

### Build
`npm run build` al final.

### Manual — flujo completo
1. Subir 2 PDFs → análisis de contradicciones funciona igual que antes.
2. Click en pestaña "Comparison" → botón "Compare Contracts" → spinner → comparativa renderizada.
3. Resumen ejecutivo visible, cláusulas exclusivas en dos columnas, pares similares con diferencias.
4. Click en pestaña "Chat" → escribir pregunta → respuesta con citas de cláusulas.
5. Pedir recomendación: "Draft a unified clause combining clause X from doc A and clause Y from doc B" → respuesta con recomendación redactada.
6. Historial del chat persiste al cambiar de pestaña y volver.

### Edge cases
- Solo 1 documento subido → `/compare` devuelve 400, `ComparisonPanel` muestra error.
- Pregunta fuera del contenido de los contratos → respuesta indicando que no hay información relevante.
- Chat con historial largo (> 6 mensajes) → los más antiguos se truncan, la conversación sigue siendo coherente.

---

## VALIDATION COMMANDS

### Level 1: Tipos backend
```bash
cd backend && source .venv/bin/activate
python -c "from models.schemas import ComparisonResponse, ChatResponse; print('OK')"
python -c "from services.comparison import compare_contracts, chat_with_contracts; print('OK')"
python -c "from routers.comparison import router; from routers.chat import router; print('OK')"
```

### Level 2: Backend lint y tipos
```bash
cd backend && source .venv/bin/activate
ruff check .
mypy . --ignore-missing-imports
```

### Level 3: Frontend tipos y build
```bash
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

### Level 4: Manual
```bash
# Terminal 1
cd backend && source .venv/bin/activate && uvicorn main:app --reload

# Terminal 2
cd frontend && npm run dev

# Probar flujo completo con 2 PDFs reales
```

---

## ACCEPTANCE CRITERIA

- [ ] `POST /compare/{session_id}` devuelve comparativa completa
- [ ] `POST /chat/{session_id}` devuelve respuesta RAG con fuentes
- [ ] Pestaña "Contradictions" sigue funcionando igual que antes
- [ ] Pestaña "Comparison" muestra resumen ejecutivo, exclusivas y similares
- [ ] Pestaña "Chat" permite conversación multi-turno con historial
- [ ] Chat genera recomendaciones de cláusulas cuando se le pide
- [ ] `ruff check .` sin errores
- [ ] `mypy . --ignore-missing-imports` sin errores
- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm run build` sin errores

---

## COMPLETION CHECKLIST

- [ ] `schemas.py` actualizado con nuevos tipos
- [ ] `services/comparison.py` creado
- [ ] `routers/comparison.py` y `routers/chat.py` creados
- [ ] `main.py` actualizado con nuevos routers
- [ ] `types/api.ts` actualizado
- [ ] `client.ts` actualizado
- [ ] `vite.config.ts` actualizado con nuevos proxies
- [ ] `useAnalysis.ts` expone `sessionId`
- [ ] `useComparison.ts` creado
- [ ] Todos los componentes de Comparison y Chat creados
- [ ] `App.tsx` actualizado con sistema de pestañas
- [ ] Validaciones de nivel 1-4 pasadas

---

## NOTES

- **Sin nueva dependencia**: Todo reutiliza openai, chromadb y fastapi ya instalados. Zero nuevas dependencias.
- **Comparación lazy**: La pestaña "Comparison" no lanza el análisis automáticamente — requiere click en "Compare Contracts". Esto evita una llamada cara a GPT-4o si el usuario no la necesita.
- **Chat stateful en backend**: El historial se guarda en `chat_store` in-memory por `session_id`. Se pierde al reiniciar el servidor, igual que el resto del estado MVP.
- **sessionId en useAnalysis**: La única modificación al hook existente es exponer `sessionId` en el estado. Es un cambio mínimo que no rompe ningún componente existente.
- **Confidence Score**: 7/10 — la lógica de comparación (find_exclusive_and_similar) depende de que los embeddings sean suficientemente buenos para distinguir cláusulas relacionadas de no relacionadas. El umbral 0.75 puede necesitar ajuste manual con PDFs reales.
