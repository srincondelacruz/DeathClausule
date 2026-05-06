# Feature: Frontend Base — Fase 2

The following plan should be complete, but validate documentation and codebase patterns before implementing.
This is a greenfield frontend. The backend is already running at http://localhost:8000.

**IMPORTANT**: Build functional structure with minimal placeholder styling only. Do NOT apply final visual design — a designer will style the components afterwards using Tailwind CSS classes. Focus on correct data flow, component structure, and API integration.

## Feature Description

Construir el frontend React de DeathClause: una SPA con tres vistas principales (Upload, Loading/Progress, Results) conectada al backend FastAPI. El flujo es lineal: el usuario sube PDFs → espera el análisis → ve el informe textual de contradicciones. El grafo D3.js se implementará en la Fase 3 — aquí solo se reserva el espacio del componente `<Graph />` con datos mockeados.

## User Story

As a legal professional,
I want to upload PDFs and see a list of contradictions between clauses,
So that I can quickly identify legal conflicts without manual review.

## Problem Statement

El frontend debe orquestar el flujo Upload → Analyze → Results consumiendo los tres endpoints del backend, mostrar feedback de progreso al usuario, y estructurar los componentes de forma que el designer pueda aplicar estilos sin tocar lógica.

## Solution Statement

React + Vite + TypeScript + Tailwind CSS. Gestión de estado con `useState`/`useReducer` local (sin Redux para MVP). API client con Axios. Componentes separados por responsabilidad, con props bien tipadas para facilitar el trabajo del designer.

## Feature Metadata

**Feature Type**: New Capability  
**Estimated Complexity**: Medium  
**Primary Systems Affected**: Frontend completo (greenfield)  
**Dependencies**: react, vite, typescript, tailwindcss, axios, d3 (instalado pero usado en Fase 3)

---

## CONTEXT REFERENCES

### Relevant Codebase Files — LEER ANTES DE IMPLEMENTAR

- `backend/models/schemas.py` — tipos exactos que devuelve la API. Los tipos TypeScript deben coincidir 1:1.
- `backend/routers/upload.py` — endpoint `POST /upload`, acepta `multipart/form-data` con campo `files`.
- `backend/routers/analysis.py` — endpoint `POST /analyze/{session_id}`.
- `backend/routers/results.py` — endpoint `GET /results/{analysis_id}`.

### New Files to Create

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/
│   │   └── api.ts               # Tipos TypeScript que mapean schemas.py
│   ├── api/
│   │   └── client.ts            # Axios client + funciones de API
│   ├── components/
│   │   ├── Upload/
│   │   │   └── UploadPanel.tsx  # Drag & drop + file selector
│   │   ├── Graph/
│   │   │   └── GraphPlaceholder.tsx  # Placeholder D3 — Fase 3
│   │   └── Report/
│   │       ├── ReportPanel.tsx  # Lista de contradicciones
│   │       └── ReportEntry.tsx  # Una entrada: par de cláusulas + explicación
│   └── hooks/
│       └── useAnalysis.ts       # Hook que orquesta upload → analyze → results
```

### Relevant Documentation

- [Vite — Getting started](https://vitejs.dev/guide/)
  - Why: scaffold con `npm create vite@latest` y configuración de proxy
- [Tailwind CSS — Installation with Vite](https://tailwindcss.com/docs/guides/vite)
  - Why: configuración de `tailwind.config.js` y `postcss.config.js`
- [Axios — multipart/form-data](https://axios-http.com/docs/multipart)
  - Why: envío de múltiples archivos con `FormData`
- [React — useReducer](https://react.dev/reference/react/useReducer)
  - Why: gestión del estado del flujo Upload → Loading → Results

### Patterns to Follow

**Naming conventions:**
- Componentes: `PascalCase` (fichero y función)
- Hooks: `camelCase` con prefijo `use`
- Tipos: `PascalCase` con sufijo del dominio (e.g. `UploadResponse`, `GraphNode`)
- Funciones de API: `camelCase` verbos (e.g. `uploadFiles`, `analyzeSession`, `getResults`)

**Separación de responsabilidades:**
- Los componentes solo renderizan — no llaman a la API directamente.
- Toda la lógica de negocio vive en `useAnalysis.ts`.
- `client.ts` solo contiene funciones de red, sin estado.

**Tipado estricto:**
- No usar `any`. Si el tipo no es conocido, usar `unknown` y narrowing.
- Todos los props de componentes deben tener interfaz explícita.

**Proxy Vite para evitar CORS en desarrollo:**
```ts
// vite.config.ts
server: {
  proxy: {
    '/upload': 'http://localhost:8000',
    '/analyze': 'http://localhost:8000',
    '/results': 'http://localhost:8000',
    '/health': 'http://localhost:8000',
  }
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Scaffold y configuración

Inicializar proyecto Vite + React + TypeScript + Tailwind. Configurar proxy al backend.

### Phase 2: Tipos y API client

Definir tipos TypeScript que mapean exactamente `schemas.py`. Implementar `client.ts` con Axios.

### Phase 3: Hook de orquestación

`useAnalysis.ts` gestiona el estado del flujo completo y expone métodos y estado a los componentes.

### Phase 4: Componentes

Implementar `UploadPanel`, `GraphPlaceholder`, `ReportPanel`, `ReportEntry` y `App.tsx`.

---

## STEP-BY-STEP TASKS

### TASK 1 — CREATE scaffold con Vite

- **IMPLEMENT**: Inicializar proyecto React + TypeScript + Tailwind

```bash
cd /home/sergio/DeathClause
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install axios
npm install d3 @types/d3
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- **VALIDATE**: `cd frontend && npm run build` sin errores

---

### TASK 2 — UPDATE `frontend/tailwind.config.js`

- **IMPLEMENT**: Activar Tailwind para todos los archivos src

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- **VALIDATE**: `npm run build` sin errores de CSS

---

### TASK 3 — UPDATE `frontend/src/index.css`

- **IMPLEMENT**: Directives de Tailwind

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- **VALIDATE**: Clases Tailwind funcionan en componentes

---

### TASK 4 — UPDATE `frontend/vite.config.ts`

- **IMPLEMENT**: Proxy al backend FastAPI para evitar CORS en desarrollo

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/upload': 'http://localhost:8000',
      '/analyze': 'http://localhost:8000',
      '/results': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    }
  }
})
```

- **VALIDATE**: `npm run dev` arranca sin errores

---

### TASK 5 — CREATE `frontend/src/types/api.ts`

- **IMPLEMENT**: Tipos TypeScript que mapean exactamente `backend/models/schemas.py`

```ts
export interface UploadedFile {
  name: string
  pages: number
  status: 'ok' | 'error'
}

export interface UploadResponse {
  session_id: string
  files: UploadedFile[]
}

export interface AnalysisResponse {
  analysis_id: string
  status: 'processing' | 'complete' | 'error'
}

export interface GraphNode {
  id: string
  doc: string
  number: string
  title: string
  text: string
}

export interface GraphEdge {
  source: string
  target: string
  severity: number
  explanation: string
}

export interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface ReportEntry {
  clause_a: GraphNode
  clause_b: GraphNode
  explanation: string
  severity: number
}

export interface ResultsResponse {
  status: string
  graph: Graph
  report: ReportEntry[]
}
```

- **GOTCHA**: Los campos aquí deben coincidir exactamente con los nombres de `schemas.py` — snake_case incluido.
- **VALIDATE**: `npx tsc --noEmit` sin errores

---

### TASK 6 — CREATE `frontend/src/api/client.ts`

- **IMPLEMENT**: Funciones de API con Axios

```ts
import axios from 'axios'
import type { UploadResponse, AnalysisResponse, ResultsResponse } from '../types/api'

const api = axios.create({ baseURL: '/' })

export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  const { data } = await api.post<UploadResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function analyzeSession(sessionId: string): Promise<AnalysisResponse> {
  const { data } = await api.post<AnalysisResponse>(`/analyze/${sessionId}`)
  return data
}

export async function getResults(analysisId: string): Promise<ResultsResponse> {
  const { data } = await api.get<ResultsResponse>(`/results/${analysisId}`)
  return data
}
```

- **GOTCHA**: `baseURL: '/'` funciona con el proxy de Vite en desarrollo. En producción, configurar la URL del backend real.
- **VALIDATE**: `npx tsc --noEmit` sin errores

---

### TASK 7 — CREATE `frontend/src/hooks/useAnalysis.ts`

- **IMPLEMENT**: Hook que orquesta el flujo completo y expone estado a los componentes

```ts
import { useReducer } from 'react'
import { uploadFiles, analyzeSession, getResults } from '../api/client'
import type { ResultsResponse, UploadedFile } from '../types/api'

type Step = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error'

interface State {
  step: Step
  uploadedFiles: UploadedFile[]
  results: ResultsResponse | null
  error: string | null
}

type Action =
  | { type: 'START_UPLOAD' }
  | { type: 'UPLOAD_DONE'; files: UploadedFile[] }
  | { type: 'START_ANALYSIS' }
  | { type: 'ANALYSIS_DONE'; results: ResultsResponse }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_UPLOAD': return { ...state, step: 'uploading', error: null }
    case 'UPLOAD_DONE': return { ...state, step: 'analyzing', uploadedFiles: action.files }
    case 'START_ANALYSIS': return { ...state, step: 'analyzing' }
    case 'ANALYSIS_DONE': return { ...state, step: 'complete', results: action.results }
    case 'ERROR': return { ...state, step: 'error', error: action.message }
    case 'RESET': return { step: 'idle', uploadedFiles: [], results: null, error: null }
    default: return state
  }
}

const initialState: State = {
  step: 'idle',
  uploadedFiles: [],
  results: null,
  error: null,
}

export function useAnalysis() {
  const [state, dispatch] = useReducer(reducer, initialState)

  async function run(files: File[]) {
    dispatch({ type: 'START_UPLOAD' })
    try {
      const uploadRes = await uploadFiles(files)
      dispatch({ type: 'UPLOAD_DONE', files: uploadRes.files })

      const analysisRes = await analyzeSession(uploadRes.session_id)

      const results = await getResults(analysisRes.analysis_id)
      dispatch({ type: 'ANALYSIS_DONE', results })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      dispatch({ type: 'ERROR', message })
    }
  }

  function reset() {
    dispatch({ type: 'RESET' })
  }

  return { ...state, run, reset }
}
```

- **GOTCHA**: El backend es síncrono — `/analyze` bloquea hasta completar. No es necesario polling en el MVP.
- **VALIDATE**: `npx tsc --noEmit` sin errores

---

### TASK 8 — CREATE `frontend/src/components/Upload/UploadPanel.tsx`

- **IMPLEMENT**: Zona de drag & drop + botón de selección + lista de archivos seleccionados

```tsx
import { useRef, useState, DragEvent } from 'react'

interface Props {
  onSubmit: (files: File[]) => void
  disabled: boolean
}

export default function UploadPanel({ onSubmit, disabled }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.pdf'))
    setFiles(prev => [...prev, ...dropped].slice(0, 5))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFiles(prev => [...prev, ...selected].slice(0, 5))
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer"
      >
        <p>Drag & drop PDFs here or click to select</p>
        <p className="text-sm text-gray-500">Max 5 files · 20MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((file, i) => (
            <li key={i} className="flex justify-between items-center px-3 py-2 rounded border">
              <span className="text-sm truncate">{file.name}</span>
              <button onClick={() => removeFile(i)} className="text-xs text-red-500 ml-2">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => files.length > 0 && onSubmit(files)}
        disabled={disabled || files.length === 0}
        className="px-4 py-2 rounded font-medium disabled:opacity-50"
      >
        Analyze Contradictions
      </button>
    </div>
  )
}
```

- **GOTCHA**: Limitar a 5 archivos en cliente (el backend también valida, pero mejor dar feedback inmediato).
- **GOTCHA**: Solo aceptar `.pdf` en el filtro del input y del drag & drop.
- **VALIDATE**: Componente renderiza sin errores de TypeScript

---

### TASK 9 — CREATE `frontend/src/components/Report/ReportEntry.tsx`

- **IMPLEMENT**: Una entrada del informe — par de cláusulas + explicación + severidad

```tsx
import type { ReportEntry as ReportEntryType } from '../../types/api'

interface Props {
  entry: ReportEntryType
  index: number
}

export default function ReportEntry({ entry, index }: Props) {
  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className="font-semibold">Contradiction #{index + 1}</span>
        <span className="text-sm font-medium px-2 py-1 rounded">
          Severity: {entry.severity}/10
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {entry.clause_a.doc} · Clause {entry.clause_a.number}
          </p>
          {entry.clause_a.title && (
            <p className="font-medium text-sm">{entry.clause_a.title}</p>
          )}
          <p className="text-sm">{entry.clause_a.text}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {entry.clause_b.doc} · Clause {entry.clause_b.number}
          </p>
          {entry.clause_b.title && (
            <p className="font-medium text-sm">{entry.clause_b.title}</p>
          )}
          <p className="text-sm">{entry.clause_b.text}</p>
        </div>
      </div>

      <div className="text-sm italic border-t pt-3">
        {entry.explanation}
      </div>
    </div>
  )
}
```

- **VALIDATE**: `npx tsc --noEmit` sin errores

---

### TASK 10 — CREATE `frontend/src/components/Report/ReportPanel.tsx`

- **IMPLEMENT**: Lista completa de contradicciones ordenadas por severidad

```tsx
import type { ReportEntry as ReportEntryType } from '../../types/api'
import ReportEntry from './ReportEntry'

interface Props {
  entries: ReportEntryType[]
}

export default function ReportPanel({ entries }: Props) {
  if (entries.length === 0) {
    return <p className="text-center py-8">No contradictions detected.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-lg">
        {entries.length} contradiction{entries.length !== 1 ? 's' : ''} found
      </h2>
      {entries.map((entry, i) => (
        <ReportEntry key={i} entry={entry} index={i} />
      ))}
    </div>
  )
}
```

- **VALIDATE**: `npx tsc --noEmit` sin errores

---

### TASK 11 — CREATE `frontend/src/components/Graph/GraphPlaceholder.tsx`

- **IMPLEMENT**: Placeholder del grafo D3 — reserva el espacio, muestra datos básicos. D3 real en Fase 3.

```tsx
import type { Graph } from '../../types/api'

interface Props {
  graph: Graph
}

export default function GraphPlaceholder({ graph }: Props) {
  return (
    <div className="border rounded-lg flex items-center justify-center h-64 bg-gray-50">
      <div className="text-center text-gray-400">
        <p className="font-medium">Contradiction Graph</p>
        <p className="text-sm mt-1">
          {graph.nodes.length} clauses · {graph.edges.length} contradictions
        </p>
        <p className="text-xs mt-1">(Interactive graph — Phase 3)</p>
      </div>
    </div>
  )
}
```

- **GOTCHA**: Este componente acepta los datos reales del grafo para que en Fase 3 solo se reemplace el interior sin cambiar la interfaz `Props`.
- **VALIDATE**: `npx tsc --noEmit` sin errores

---

### TASK 12 — CREATE `frontend/src/App.tsx`

- **IMPLEMENT**: Orquestador principal — renderiza la vista correcta según el step del hook

```tsx
import UploadPanel from './components/Upload/UploadPanel'
import GraphPlaceholder from './components/Graph/GraphPlaceholder'
import ReportPanel from './components/Report/ReportPanel'
import { useAnalysis } from './hooks/useAnalysis'

export default function App() {
  const { step, results, error, run, reset } = useAnalysis()

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold">DeathClause</h1>
        <p className="text-gray-500 mt-1">Legal contradiction detection</p>
      </header>

      {step === 'idle' && (
        <UploadPanel onSubmit={run} disabled={false} />
      )}

      {(step === 'uploading' || step === 'analyzing') && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">
            {step === 'uploading' ? 'Uploading documents...' : 'Analyzing contradictions...'}
          </p>
        </div>
      )}

      {step === 'error' && (
        <div className="flex flex-col gap-4">
          <p className="text-red-500">{error}</p>
          <button onClick={reset} className="px-4 py-2 rounded border w-fit">
            Try again
          </button>
        </div>
      )}

      {step === 'complete' && results && (
        <div className="flex flex-col gap-8">
          <GraphPlaceholder graph={results.graph} />
          <ReportPanel entries={results.report} />
          <button onClick={reset} className="px-4 py-2 rounded border w-fit">
            Analyze new documents
          </button>
        </div>
      )}
    </main>
  )
}
```

- **VALIDATE**: `npm run dev` → abrir `http://localhost:5173` y verificar que renderiza sin errores de consola

---

## TESTING STRATEGY

### TypeScript
- `npx tsc --noEmit` debe pasar sin errores en todos los archivos.

### Build
- `npm run build` debe completar sin errores ni warnings críticos.

### Manual — flujo completo
1. Subir 2 PDFs → verificar estado "Uploading" y luego "Analyzing"
2. Verificar que el informe muestra las contradicciones con las cláusulas correctas
3. Verificar que el placeholder del grafo muestra el número correcto de nodos y aristas
4. Click "Analyze new documents" → volver al estado inicial

### Edge cases
- Subir 0 archivos → botón deshabilitado
- Subir un archivo no PDF → filtrado en drag & drop y en input
- Backend devuelve 0 contradicciones → mensaje "No contradictions detected"
- Backend devuelve error → mensaje de error + botón "Try again"

---

## VALIDATION COMMANDS

### Level 1: Tipos
```bash
cd frontend
npx tsc --noEmit
```

### Level 2: Lint
```bash
cd frontend
npm run lint
```

### Level 3: Build
```bash
cd frontend
npm run build
```

### Level 4: Manual
```bash
# Terminal 1 — backend
cd backend && source .venv/bin/activate && uvicorn main:app --reload

# Terminal 2 — frontend
cd frontend && npm run dev
# Abrir http://localhost:5173
```

---

## ACCEPTANCE CRITERIA

- [ ] `npm run build` completa sin errores
- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm run lint` sin errores
- [ ] La vista Upload renderiza con drag & drop funcional
- [ ] El flujo Upload → Loading → Results funciona con PDFs reales
- [ ] El informe muestra las contradicciones ordenadas por severidad
- [ ] `GraphPlaceholder` muestra el número correcto de nodos y aristas
- [ ] El estado de error muestra el mensaje y permite reintentar
- [ ] El botón "Analyze new documents" resetea el estado correctamente

---

## COMPLETION CHECKLIST

- [ ] Todas las tareas completadas en orden
- [ ] `npx tsc --noEmit` pasa tras cada tarea
- [ ] `npm run build` pasa al final
- [ ] Prueba manual con PDFs reales completada
- [ ] Criterios de aceptación cumplidos

---

## NOTES

- **Sin estilos finales**: Las clases Tailwind aplicadas son funcionales mínimas (layout, spacing, borders). El designer las reemplazará con el sistema visual definitivo.
- **Props tipadas en todos los componentes**: Facilita que el designer sepa exactamente qué datos recibe cada componente sin leer la lógica.
- **GraphPlaceholder**: La interfaz `Props` acepta ya el tipo `Graph` real para que en Fase 3 solo se reemplace el rendering D3 sin cambiar la firma del componente.
- **Confidence Score**: 9/10 — el flujo es sencillo y el backend ya está validado. El riesgo principal es la latencia del análisis (puede tardar 30-60s), que con el spinner de loading queda cubierto visualmente.
