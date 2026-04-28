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
