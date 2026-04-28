# PRD — DeathClausule

## 1. Executive Summary

DeathClausule es una aplicación SaaS de detección automática de contradicciones en documentos legales. El usuario sube dos o más PDFs (contratos, anexos, adendas) y el sistema extrae las cláusulas, genera embeddings semánticos y cruza los documentos para identificar pares de cláusulas que se contradicen entre sí. Los resultados se presentan como un grafo interactivo y un informe textual detallado.

El valor diferencial es claro: un abogado o paralegal que revisa manualmente 3 contratos de 50 páginas puede tardar horas. DeathClausule lo hace en segundos, con explicaciones en lenguaje natural de por qué cada par es contradictorio y qué tan grave es la contradicción.

**MVP goal:** Sistema funcional que procese 2–5 PDFs, detecte contradicciones entre cláusulas de distintos documentos, y presente los resultados en grafo + informe. Desplegable en local.

---

## 2. Mission

Automatizar la detección de contradicciones legales entre documentos, reduciendo el tiempo de revisión de contratos y el riesgo de errores humanos.

**Principios:**
- Precisión sobre velocidad: mejor menos contradicciones detectadas pero correctas que muchos falsos positivos.
- Explicabilidad: cada contradicción debe ir acompañada de una explicación en lenguaje natural.
- Simplicidad de uso: subir PDFs y obtener resultados, sin configuración.
- Sin agentes: todo el flujo es determinista + LLM puntual, no sistemas multi-agente.

---

## 3. Target Users

**Persona principal:** Abogado junior o paralegal en un despacho que recibe un paquete de contratos (contrato marco + anexos + adendas) y necesita verificar que no haya contradicciones antes de firmar.

- Nivel técnico: bajo-medio (usa la interfaz web, no la API).
- Pain point: revisión manual es lenta, cara y propensa a errores.
- Necesidad: saber rápidamente "¿hay algo en este documento que contradiga lo que dice el otro?"

**Persona secundaria (evaluador del curso):** Profesor técnico que valora arquitectura limpia, uso real de embeddings + RAG, y una demo funcional convincente.

---

## 4. MVP Scope

### Core Functionality
- ✅ Subida de 2–5 PDFs por sesión
- ✅ Extracción de cláusulas via PyMuPDF + GPT-4o (chunking semántico)
- ✅ Generación de embeddings con Azure OpenAI
- ✅ Almacenamiento en ChromaDB
- ✅ Detección de contradicciones por similitud coseno + veredicto LLM
- ✅ Grafo interactivo D3.js (nodos = cláusulas, aristas rojas = contradicciones, grosor = severidad)
- ✅ Informe textual con cada par contradictorio explicado
- ✅ `.env.example` y tutorial de despliegue local

### Out of Scope (MVP)
- ❌ Autenticación / sistema de usuarios
- ❌ Persistencia entre sesiones (cada análisis es stateless)
- ❌ Soporte Word/DOCX
- ❌ Despliegue en cloud
- ❌ Multiidioma explícito (funciona en español/inglés pero sin configuración)
- ❌ Export del informe a PDF
- ❌ Historial de análisis anteriores

---

## 5. User Stories

1. **Como abogado**, quiero subir varios PDFs a la vez, para analizar todo el paquete contractual en una sola operación.
2. **Como abogado**, quiero ver un grafo visual de las contradicciones, para entender de un vistazo qué documentos y cláusulas están en conflicto.
3. **Como abogado**, quiero leer una explicación en lenguaje natural de cada contradicción, para saber exactamente qué dice cada cláusula y por qué se contradicen.
4. **Como abogado**, quiero que las contradicciones estén ordenadas por severidad, para priorizar las más críticas primero.
5. **Como usuario**, quiero que el sistema procese mis documentos en menos de 60 segundos, para que sea útil en el día a día.
6. **Como usuario**, quiero ver el progreso del análisis en tiempo real, para saber que el sistema está trabajando.
7. **Como evaluador técnico**, quiero ver un flujo claro de embeddings + búsqueda semántica + LLM, para verificar que la IA aporta valor real y no es decorativa.

---

## 6. Core Architecture & Patterns

```
[Frontend React]
      │  multipart/form-data (PDFs)
      ▼
[FastAPI Backend]
      │
      ├── POST /upload        → guarda PDFs en memoria/disco temporal
      ├── POST /analyze       → ejecuta el pipeline completo
      └── GET  /results/{id}  → devuelve grafo + informe
      │
      ▼
[Pipeline]
  1. extractor.py     → PyMuPDF extrae texto → GPT-4o trocea en cláusulas
  2. embeddings.py    → Azure OpenAI genera embeddings por cláusula
  3. vector_store.py  → ChromaDB almacena cláusulas + embeddings + metadata
  4. contradictions.py → coseno similarity (top-N por cláusula, solo otros docs)
                        → GPT-4o verifica cada par → veredicto + severidad 1-10
```

**Patrones clave:**
- Pipeline lineal, sin paralelismo complejo en MVP.
- Cada cláusula tiene metadata: `{doc_id, clause_number, title, page, text}`.
- Contradicciones solo entre documentos distintos (no dentro del mismo PDF).
- ChromaDB en modo persistente local (`./chroma_db`).

**Estructura de directorios:**
```
DeathClausule/
├── backend/
│   ├── main.py
│   ├── routers/
│   │   ├── upload.py
│   │   ├── analysis.py
│   │   └── results.py
│   ├── services/
│   │   ├── extractor.py
│   │   ├── embeddings.py
│   │   ├── vector_store.py
│   │   └── contradictions.py
│   ├── models/
│   │   └── schemas.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Upload/
│   │   │   ├── Graph/
│   │   │   └── Report/
│   │   └── api/
│   │       └── client.ts
│   ├── package.json
│   └── index.html
├── README.md
├── PRD.md
└── CLAUDE.md
```

---

## 7. Features

### Upload
- Drag & drop o selector de archivos, múltiples PDFs simultáneos.
- Validación: solo `.pdf`, máximo 5 archivos, máximo 20MB por archivo.
- Feedback visual de progreso durante el análisis.

### Extracción de cláusulas
- PyMuPDF extrae texto raw por página.
- GPT-4o recibe el texto y devuelve JSON con array de cláusulas: `[{number, title, body}]`.
- Prompt diseñado para preservar cláusulas completas (no cortar en párrafos).

### Embeddings + ChromaDB
- Un embedding por cláusula (`text-embedding-3-small` o el deployment configurado).
- Colección única por sesión de análisis (UUID).
- Metadata almacenada: `doc_id`, `doc_name`, `clause_number`, `clause_title`, `page`.

### Detección de contradicciones
- Para cada cláusula, query ChromaDB top-10 más similares de **otros documentos**.
- Umbral mínimo de similitud: 0.75 (configurable).
- Cada par candidato → prompt a GPT-4o: "¿Se contradicen estas dos cláusulas? Responde JSON: `{contradiction: bool, explanation: str, severity: int 1-10}`".
- Deduplicación de pares (A-B == B-A).

### Grafo D3.js
- Nodos: cláusulas (agrupadas por documento con color).
- Aristas: solo pares con `contradiction: true`.
- Grosor de arista proporcional a `severity`.
- Hover sobre arista muestra explicación.
- Click en nodo muestra texto completo de la cláusula.

### Informe textual
- Lista ordenada por severidad descendente.
- Cada entrada: nombre doc A + cláusula A | nombre doc B + cláusula B | explicación | severidad.

---

## 8. Technology Stack

| Layer | Tech | Version |
|---|---|---|
| Backend | Python + FastAPI | 3.11+ / 0.110+ |
| PDF parsing | PyMuPDF (fitz) | 1.23+ |
| AI | Azure OpenAI (GPT-4o + embeddings) | API 2024-02 |
| Vector DB | ChromaDB | 0.4+ |
| Frontend | React + Vite + Tailwind CSS | 18 / 5 / 3 |
| Visualization | D3.js | 7 |
| HTTP client | Axios | 1.x |
| Types | TypeScript | 5.x |
| Linting/types | ruff + mypy (backend), ESLint (frontend) | latest |

---

## 9. Security & Configuration

**Variables de entorno (backend):**
```
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT_EMBEDDINGS=text-embedding-3-small
AZURE_OPENAI_DEPLOYMENT_GPT4O=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-01
CHROMA_PERSIST_DIR=./chroma_db
MAX_FILES=5
MAX_FILE_SIZE_MB=20
SIMILARITY_THRESHOLD=0.75
```

**Seguridad MVP:**
- ✅ Validación de tipo y tamaño de archivo en backend.
- ✅ No se almacenan PDFs en disco de forma permanente (tmpdir).
- ✅ `.env` en `.gitignore`, solo se sube `.env.example`.
- ❌ Auth/RBAC fuera de scope.
- ❌ Rate limiting fuera de scope.

---

## 10. API Specification

### POST `/upload`
```json
// Request: multipart/form-data
{ "files": [File, File, ...] }

// Response 200
{
  "session_id": "uuid",
  "files": [{"name": "contrato.pdf", "pages": 12, "status": "ok"}]
}
```

### POST `/analyze/{session_id}`
```json
// Response 200
{
  "analysis_id": "uuid",
  "status": "processing" | "complete" | "error"
}
```

### GET `/results/{analysis_id}`
```json
{
  "status": "complete",
  "graph": {
    "nodes": [{"id": "clause_uuid", "doc": "contrato.pdf", "number": "3.1", "title": "...", "text": "..."}],
    "edges": [{"source": "uuid1", "target": "uuid2", "severity": 8, "explanation": "..."}]
  },
  "report": [
    {
      "clause_a": {"doc": "contrato.pdf", "number": "3.1", "title": "...", "text": "..."},
      "clause_b": {"doc": "anexo.pdf", "number": "2.4", "title": "...", "text": "..."},
      "explanation": "La cláusula 3.1 establece X mientras que la 2.4 establece Y...",
      "severity": 8
    }
  ]
}
```

### GET `/health`
```json
{ "status": "ok" }
```

---

## 11. Success Criteria

**El MVP es exitoso si:**
- ✅ Se pueden subir 2+ PDFs y obtener resultados sin errores.
- ✅ Las contradicciones detectadas son semánticamente correctas (verificación manual con PDFs de prueba).
- ✅ El grafo D3.js renderiza correctamente con nodos y aristas.
- ✅ El informe es legible y ordenado por severidad.
- ✅ El pipeline completo corre en < 90 segundos para 3 PDFs de 10 páginas.
- ✅ El proyecto arranca en local siguiendo el README sin pasos adicionales.
- ✅ `mypy`, `ruff`, y `npm run build` pasan sin errores.

---

## 12. Implementation Phases

### Fase 1 — Backend core (día 1-2)
**Goal:** Pipeline funcional de extremo a extremo, testeable via curl/Postman.
- ✅ Scaffold FastAPI + estructura de carpetas
- ✅ `extractor.py`: PyMuPDF + prompt GPT-4o → JSON de cláusulas
- ✅ `embeddings.py`: Azure OpenAI embeddings
- ✅ `vector_store.py`: ChromaDB store + query
- ✅ `contradictions.py`: similitud coseno + veredicto LLM
- ✅ Routers: `/upload`, `/analyze`, `/results`
- ✅ Validación: `mypy` + `ruff` + pytest con PDF de prueba

### Fase 2 — Frontend base (día 2-3)
**Goal:** UI funcional conectada al backend.
- ✅ Scaffold React + Vite + Tailwind
- ✅ Componente Upload con drag & drop
- ✅ API client (Axios)
- ✅ Componente Report (informe textual)
- ✅ Validación: `npm run build` + `eslint`

### Fase 3 — Grafo D3.js (día 3-4)
**Goal:** Visualización interactiva funcionando.
- ✅ Componente Graph con D3.js force layout
- ✅ Nodos coloreados por documento
- ✅ Aristas con grosor por severidad
- ✅ Hover/click interactivo
- ✅ Validación: prueba manual con datos reales

### Fase 4 — Pulido y entrega (día 4-5)
**Goal:** Proyecto listo para presentación.
- ✅ README completo con tutorial de despliegue
- ✅ `.env.example`
- ✅ `.gitignore`
- ✅ Slides del pitch comercial
- ✅ Ensayo de demo en vivo

---

## 13. Future Considerations

- Export del informe a PDF.
- Soporte DOCX/Word.
- Historial de análisis con persistencia por usuario.
- Auth con OAuth2.
- Despliegue en Azure Container Apps.
- Modo "track changes": detectar cómo una adenda modifica el contrato original.

---

## 14. Risks & Mitigations

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| GPT-4o chunking produce cláusulas mal cortadas | Media | Prompt con ejemplos few-shot + validación manual con PDF de prueba |
| Demasiados falsos positivos en contradicciones | Alta | Umbral de similitud 0.75 + prompt estricto con ejemplos negativos |
| ChromaDB lento con muchas cláusulas | Baja | MVP limitado a 5 PDFs; suficiente para demo |
| Credenciales Azure no disponibles a tiempo | Media | Probar con OpenAI API como fallback si es necesario |
| D3.js complejo de implementar en tiempo | Media | Usar force-directed graph básico primero, pulir después |

---

## 15. Appendix

- **CLAUDE.md:** Reglas del proyecto para el agente de codificación.
- **Metodología:** PIV (Plan → Implement → Validate) — [AI-Coding-Package](https://github.com/hugomoreno-tajamar/AI-Coding-Package)
- **Stack de referencia:** FastAPI docs, ChromaDB docs, Azure OpenAI API reference, D3.js force simulation.
- **Autores:** Sergio (+ compañero)
