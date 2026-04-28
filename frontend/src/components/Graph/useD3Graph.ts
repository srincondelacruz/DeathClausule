import { useEffect } from 'react'
import * as d3 from 'd3'
import type { Graph, GraphNode, GraphEdge } from '../../types/api'

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

    const nodes: SimNode[] = graph.nodes.map(n => ({ ...n }))
    const nodeById = new Map(nodes.map(n => [n.id, n]))
    const links: SimLink[] = graph.edges.map((e: GraphEdge) => ({
      source: nodeById.get(e.source) ?? e.source,
      target: nodeById.get(e.target) ?? e.target,
      severity: e.severity,
      explanation: e.explanation,
    }))

    const g = svg.append('g')

    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => g.attr('transform', event.transform))
    )

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

    return () => {
      simulation.stop()
      svg.selectAll('*').remove()
    }
  }, [graph, onNodeClick, onEdgeHover, svgRef])
}
