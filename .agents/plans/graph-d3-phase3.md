# Feature: Grafo D3.js — Fase 3

The following plan should be complete, but validate documentation and codebase patterns before implementing.

**IMPORTANT**: This plan replaces `GraphPlaceholder.tsx` with a real D3.js force-directed graph. The `Props` interface (`{ graph: Graph }`) must NOT change — `App.tsx` already passes the correct data and must not be modified.

## Feature Description

Reemplazar `GraphPlaceholder.tsx` con un grafo interactivo D3.js force-directed. Nodos = cláusulas (coloreados por documento), aristas = contradicciones (grosor proporcional a severidad). Interactividad: hover sobre arista muestra explicación, click en nodo muestra texto completo de la cláusula en un panel lateral.

## User Story

As a legal professional,
I want to see an interactive graph of contradictions between clauses,
So that I can understand at a glance which documents and clauses are in conflict and how severe each contradiction is.

## Problem Statement

El `GraphPlaceholder` actual no aporta valor visual. El grafo D3.js convierte los datos de contradicciones en una visualización interactiva que permite explorar relaciones entre cláusulas de distintos documentos.

## Solution Statement

D3.js v7 force simulation dentro de un `<svg>` React controlado con `useRef` y `useEffect`. El layout es calculado por D3, el rendering es SVG nativo. Panel lateral para detalle de nodo al hacer click.

## Feature Metadata

**Feature Type**: Enhancement (reemplaza placeholder)  
**Estimated Complexity**: High  
**Primary Systems Affected**: `frontend/src/components/Graph/`  
**Dependencies**: d3 v7 (ya instalado), @types/d3 (ya instalado)

---

## CONTEXT REFERENCES

### Relevant Codebase Files — LEER ANTES DE IMPLEMENTAR

- `frontend/src/components/Graph/GraphPlaceholder.tsx` — archivo a reemplazar. La interfaz `Props` debe mantenerse igual.
- `frontend/src/types/api.ts` — tipos `Graph`, `GraphNode`, `GraphEdge`. Líneas relevantes:
  ```ts
  interface GraphNode { id: string; doc: string; number: string; title: string; text: string }
  interface GraphEdge { source: string; target: string; severity: number; explanation: string }
  interface Graph { nodes: GraphNode[]; edges: GraphEdge[] }
  ```
- `frontend/src/App.tsx` — usa `<GraphPlaceholder graph={results.graph} />`. No modificar.

### New Files to Create

```
frontend/src/components/Graph/
├── ContradictionGraph.tsx   # Componente principal D3 — reemplaza GraphPlaceholder
├── useD3Graph.ts            # Hook que encapsula toda la lógica D3
└── NodeDetail.tsx           # Panel lateral con detalle de nodo seleccionado
```

### Files to Rename/Replace

- **RENAME** `GraphPlaceholder.tsx` → mantener el archivo pero **reemplazar todo su contenido** con el nuevo componente. El import en `App.tsx` seguirá funcionando sin cambios.

### Relevant Documentation

- [D3 force simulation](https://d3js.org/d3-force)
  - Why: `forceSimulation`, `forceLink`, `forceManyBody`, `forceCenter` — base del layout
- [D3 zoom & pan](https://d3js.org/d3-zoom)
  - Why: `d3.zoom()` para hacer el grafo navegable
- [D3 con React — patrón useRef/useEffect](https://2019.wattenberger.com/blog/react-and-d3)
  - Why: D3 manipula el DOM directamente — usar `useRef` para el SVG y `useEffect` para inicializar/actualizar

### Patterns to Follow

**Patrón D3 + React:**
```tsx
const svgRef = useRef<SVGSVGElement>(null)

useEffect(() => {
  if (!svgRef.current) return
  const svg = d3.select(svgRef.current)
  // toda la lógica D3 aquí
  return () => { svg.selectAll('*').remove() } // cleanup
}, [graph])

return <svg ref={svgRef} width="100%" height="500" />
```

**Nunca mezclar estado React con mutaciones D3** — D3 es dueño del SVG, React es dueño del resto del componente.

**Color por documento:**
```ts
const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
// colorScale(node.doc) → color único por nombre de documento
```

**Grosor de arista por severidad:**
```ts
const strokeWidth = (severity: number) => 1 + (severity / 10) * 8  // 1px a 9px
```

---

## IMPLEMENTATION PLAN

### Phase 1: Hook D3

Encapsular toda la lógica D3 en `useD3Graph.ts`: simulación, zoom, eventos.

### Phase 2: Componente principal

`ContradictionGraph.tsx` usa el hook y renderiza SVG + panel lateral.

### Phase 3: Panel de detalle

`NodeDetail.tsx` muestra el texto completo de la cláusula seleccionada.

### Phase 4: Reemplazar placeholder

Sustituir el contenido de `GraphPlaceholder.tsx` para que exporte `ContradictionGraph`.

---

## STEP-BY-STEP TASKS

### TASK 1 — CREATE `frontend/src/components/Graph/NodeDetail.tsx`

- **IMPLEMENT**: Panel lateral que muestra la cláusula seleccionada

```tsx
import type { GraphNode } from '../../types/api'

interface Props {
  node: GraphNode | null
  onClose: () => void
}

export default function NodeDetail({ node, onClose }: Props) {
  if (!node) return null

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {node.doc}
          </p>
          <p className="font-semibold">
            Clause {node.number}{node.title ? ` — ${node.title}` : ''}
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
          ✕
        </button>
      </div>
      <p className="text-sm leading-relaxed">{node.text}</p>
    </div>
  )
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 2 — CREATE `frontend/src/components/Graph/useD3Graph.ts`

- **IMPLEMENT**: Hook que encapsula toda la lógica D3 — simulación, zoom, eventos de nodo/arista

```ts
import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import type { Graph, GraphNode, GraphEdge } from '../../types/api'

// D3 necesita objetos mutables para la simulación — extender los tipos
interface SimNode extends GraphNode {
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface SimLink {
  source: SimNode | string
  target: SimNode | string
  severity: number
  explanation: string
}

interface UseD3GraphOptions {
  graph: Graph
  onNodeClick: (node: GraphNode) => void
  onEdgeHover: (explanation: string | null) => void
}

export function useD3Graph(
  svgRef: React.RefObject<SVGSVGElement | null>,
  { graph, onNodeClick, onEdgeHover }: UseD3GraphOptions
) {
  useEffect(() => {
    if (!svgRef.current || graph.nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth || 800
    const height = 500

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
    const strokeWidth = (severity: number) => 1 + (severity / 10) * 8

    // Copiar nodos y links para que D3 pueda mutarlos
    const nodes: SimNode[] = graph.nodes.map(n => ({ ...n }))
    const nodeById = new Map(nodes.map(n => [n.id, n]))
    const links: SimLink[] = graph.edges.map(e => ({
      source: nodeById.get(e.source) ?? e.source,
      target: nodeById.get(e.target) ?? e.target,
      severity: e.severity,
      explanation: e.explanation,
    }))

    // Zoom container
    const g = svg.append('g')

    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => g.attr('transform', event.transform))
    )

    // Aristas
    const link = g.append('g')
      .selectAll<SVGLineElement, SimLink>('line')
      .data(links)
      .join('line')
      .attr('stroke', '#ef4444')
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', d => strokeWidth(d.severity))
      .style('cursor', 'pointer')
      .on('mouseenter', (_event, d) => onEdgeHover(d.explanation))
      .on('mouseleave', () => onEdgeHover(null))

    // Nodos
    const node = g.append('g')
      .selectAll<SVGCircleElement, SimNode>('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 10)
      .attr('fill', d => colorScale(d.doc))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => onNodeClick(d))

    // Labels
    const label = g.append('g')
      .selectAll<SVGTextElement, SimNode>('text')
      .data(nodes)
      .join('text')
      .text(d => `${d.number}`)
      .attr('font-size', 10)
      .attr('text-anchor', 'middle')
      .attr('dy', -14)
      .attr('fill', '#374151')
      .style('pointer-events', 'none')

    // Drag
    node.call(
      d3.drag<SVGCircleElement, SimNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
    )

    // Simulación
    const simulation = d3.forceSimulation<SimNode>(nodes)
      .force('link', d3.forceLink<SimNode, SimLink>(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .on('tick', () => {
        link
          .attr('x1', d => (d.source as SimNode).x ?? 0)
          .attr('y1', d => (d.source as SimNode).y ?? 0)
          .attr('x2', d => (d.target as SimNode).x ?? 0)
          .attr('y2', d => (d.target as SimNode).y ?? 0)
        node
          .attr('cx', d => d.x ?? 0)
          .attr('cy', d => d.y ?? 0)
        label
          .attr('x', d => d.x ?? 0)
          .attr('y', d => d.y ?? 0)
      })

    return () => {
      simulation.stop()
      svg.selectAll('*').remove()
    }
  }, [graph, onNodeClick, onEdgeHover, svgRef])
}
```

- **GOTCHA**: D3 muta los objetos nodo añadiendo `x`, `y`, `vx`, `vy`. Por eso se hace una copia con spread antes de pasarlos a la simulación — nunca mutar los props originales.
- **GOTCHA**: `d3.forceLink` necesita que `source` y `target` sean referencias a los objetos nodo, no strings. Por eso se resuelven con `nodeById.get()` antes de crear los links.
- **GOTCHA**: `svgRef.current.clientWidth` puede ser 0 si el SVG no está en el DOM todavía. El fallback `|| 800` evita un layout colapsado.
- **GOTCHA**: El cleanup `simulation.stop()` es crítico — sin él la simulación sigue corriendo tras desmontar el componente.
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 3 — CREATE `frontend/src/components/Graph/ContradictionGraph.tsx`

- **IMPLEMENT**: Componente principal que usa el hook D3 y gestiona estado local de nodo seleccionado y tooltip

```tsx
import { useRef, useState, useCallback } from 'react'
import type { Graph, GraphNode } from '../../types/api'
import { useD3Graph } from './useD3Graph'
import NodeDetail from './NodeDetail'

interface Props {
  graph: Graph
}

export default function ContradictionGraph({ graph }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [edgeTooltip, setEdgeTooltip] = useState<string | null>(null)

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node)
  }, [])

  const handleEdgeHover = useCallback((explanation: string | null) => {
    setEdgeTooltip(explanation)
  }, [])

  useD3Graph(svgRef, { graph, onNodeClick: handleNodeClick, onEdgeHover: handleEdgeHover })

  if (graph.nodes.length === 0) {
    return (
      <div className="border rounded-lg flex items-center justify-center h-64">
        <p className="text-gray-400">No contradictions to display</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative border rounded-lg overflow-hidden">
        <svg ref={svgRef} width="100%" height="500" />
        {edgeTooltip && (
          <div className="absolute bottom-4 left-4 right-4 bg-white border rounded-lg p-3 shadow text-sm">
            {edgeTooltip}
          </div>
        )}
      </div>
      <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
    </div>
  )
}
```

- **GOTCHA**: `useCallback` en los handlers es necesario porque `useD3Graph` los recibe como dependencias del `useEffect`. Sin `useCallback` el efecto se re-ejecutaría en cada render.
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 4 — UPDATE `frontend/src/components/Graph/GraphPlaceholder.tsx`

- **IMPLEMENT**: Reemplazar todo el contenido para que re-exporte `ContradictionGraph` con la misma interfaz

```tsx
export { default } from './ContradictionGraph'
```

- **GOTCHA**: `App.tsx` importa `GraphPlaceholder` — con este re-export no hay que tocar `App.tsx`.
- **VALIDATE**: `npx tsc --noEmit` && `npm run build`

---

## TESTING STRATEGY

### TypeScript
- `npx tsc --noEmit` debe pasar sin errores tras cada tarea.

### Build
- `npm run build` sin errores ni warnings críticos.

### Manual — casos a verificar
1. Grafo renderiza con datos reales (PDFs con contradicciones detectadas).
2. Nodos tienen colores distintos por documento.
3. Aristas tienen grosor proporcional a severidad.
4. Hover sobre arista muestra la explicación en el tooltip inferior.
5. Click en nodo muestra `NodeDetail` con texto completo.
6. Click en el mismo nodo o en ✕ cierra el panel.
7. Drag de nodo funciona — el nodo sigue al cursor.
8. Zoom y pan funcionan con scroll y drag sobre el fondo.
9. Si no hay contradicciones, muestra "No contradictions to display".

### Edge cases
- Grafo con 1 sola arista (2 nodos).
- Grafo con muchos nodos (10+) — verificar que la simulación no colapsa.
- Nodo sin título (`title: ""`) — el label solo muestra el número.

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
# Terminal 1
cd backend && source .venv/bin/activate && uvicorn main:app --reload

# Terminal 2
cd frontend && npm run dev
# Subir PDFs con contradicciones conocidas y verificar el grafo
```

---

## ACCEPTANCE CRITERIA

- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit` sin errores
- [ ] El grafo renderiza con nodos y aristas en datos reales
- [ ] Colores distintos por documento
- [ ] Grosor de arista proporcional a severidad
- [ ] Hover sobre arista muestra explicación
- [ ] Click en nodo muestra texto completo en `NodeDetail`
- [ ] Drag, zoom y pan funcionan
- [ ] `App.tsx` no fue modificado

---

## COMPLETION CHECKLIST

- [ ] `NodeDetail.tsx` creado y validado
- [ ] `useD3Graph.ts` creado y validado
- [ ] `ContradictionGraph.tsx` creado y validado
- [ ] `GraphPlaceholder.tsx` actualizado a re-export
- [ ] `npx tsc --noEmit` pasa
- [ ] `npm run build` pasa
- [ ] Prueba manual con PDFs reales completada

---

## NOTES

- **Re-export pattern**: `GraphPlaceholder.tsx` pasa a ser un thin re-export de `ContradictionGraph`. Esto evita modificar `App.tsx` y mantiene compatibilidad con cualquier otro import existente.
- **D3 es dueño del SVG**: Toda mutación del DOM SVG ocurre dentro del `useEffect` del hook. React nunca toca el interior del `<svg>`. Esta separación es crítica para evitar conflictos entre el virtual DOM de React y las mutaciones directas de D3.
- **Cleanup**: El `return () => { simulation.stop(); svg.selectAll('*').remove() }` del useEffect es imprescindible. Sin él, al navegar entre vistas o re-renderizar, quedarían múltiples simulaciones corriendo en paralelo.
- **Confidence Score**: 7/10 — D3 force simulation tiene bastantes gotchas con TypeScript y React. Los riesgos principales son: tipos incorrectos en los links tras la simulación (source/target pasan de string a objeto), y el clientWidth siendo 0 en el primer render. Ambos están cubiertos en los GOTCHA de cada tarea.
