import { useRef, useState, useCallback, useMemo } from 'react'
import type { Graph, GraphNode } from '../../types/api'
import { useD3Graph } from './useD3Graph'
import NodeDetail from './NodeDetail'

interface Props {
  graph: Graph
}

const DOC_PALETTE = ['#0a0a0a', '#525252', '#a3a3a3', '#404040', '#737373', '#262626']

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

  const docs = useMemo(() => {
    const set = new Set<string>()
    graph.nodes.forEach(n => set.add(n.doc))
    return Array.from(set)
  }, [graph.nodes])

  const stats = useMemo(() => {
    const high = graph.edges.filter(e => e.severity >= 7).length
    const med = graph.edges.filter(e => e.severity >= 4 && e.severity < 7).length
    const low = graph.edges.filter(e => e.severity < 4).length
    return { high, med, low }
  }, [graph.edges])

  if (graph.nodes.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm flex items-center justify-center h-72">
        <p className="text-gray-400 dark:text-neutral-500 text-sm">No contradictions to display</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100 dark:bg-neutral-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800">
        {[
          { k: 'Clauses', v: graph.nodes.length, color: 'text-gray-900 dark:text-neutral-100' },
          { k: 'Conflicts', v: graph.edges.length, color: 'text-gray-900 dark:text-neutral-100' },
          { k: 'High severity', v: stats.high, color: 'text-red-500' },
          { k: 'Medium / Low', v: stats.med + stats.low, color: 'text-orange-400' },
        ].map(s => (
          <div key={s.k} className="bg-white dark:bg-neutral-900 px-6 py-5 flex flex-col gap-1">
            <p className="text-[11px] uppercase tracking-widest font-medium text-gray-400 dark:text-neutral-500">{s.k}</p>
            <p className={`text-2xl font-semibold tracking-tight ${s.color}`}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Graph card */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-white via-white/90 to-transparent dark:from-neutral-900 dark:via-neutral-900/90">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <p className="text-xs font-medium text-gray-500 dark:text-neutral-400 tracking-tight">Contradiction graph</p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[11px] text-gray-400 dark:text-neutral-500">
            <span>scroll to zoom</span>
            <span className="w-px h-3 bg-gray-200 dark:bg-neutral-700" />
            <span>drag nodes</span>
          </div>
        </div>

        <svg ref={svgRef} width="100%" height="520" className="block" />

        {/* Legend bottom-left */}
        <div className="absolute bottom-4 left-4 bg-white/85 dark:bg-neutral-900/85 backdrop-blur border border-gray-100 dark:border-neutral-800 rounded-xl p-3 shadow-sm flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest font-medium text-gray-400 dark:text-neutral-500">Documents</p>
          <div className="flex flex-col gap-1.5">
            {docs.slice(0, 5).map((doc, i) => (
              <div key={doc} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: DOC_PALETTE[i % DOC_PALETTE.length] }}
                />
                <span className="text-xs text-gray-700 dark:text-neutral-300 max-w-[14rem] truncate">{doc}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-gray-100 dark:bg-neutral-800 my-1" />
          <p className="text-[10px] uppercase tracking-widest font-medium text-gray-400 dark:text-neutral-500">Severity</p>
          <div className="flex flex-col gap-1.5">
            {[
              { c: '#ef4444', l: 'High' },
              { c: '#fb923c', l: 'Medium' },
              { c: '#eab308', l: 'Low' },
            ].map(s => (
              <div key={s.l} className="flex items-center gap-2">
                <span className="w-6 h-0.5 rounded-full" style={{ backgroundColor: s.c }} />
                <span className="text-xs text-gray-700 dark:text-neutral-300">{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Edge tooltip */}
        {edgeTooltip && (
          <div className="absolute bottom-4 right-4 max-w-sm bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl px-4 py-3 shadow-md text-xs text-gray-700 dark:text-neutral-300 leading-relaxed animate-fade-in">
            {edgeTooltip}
          </div>
        )}
      </div>

      {selectedNode && <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </div>
  )
}
