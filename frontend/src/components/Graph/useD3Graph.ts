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

const DOC_PALETTE_LIGHT = ['#0a0a0a', '#525252', '#a3a3a3', '#404040', '#737373', '#262626']
const DOC_PALETTE_DARK = ['#ffffff', '#d4d4d4', '#737373', '#a3a3a3', '#e5e5e5', '#525252']

function severityColor(s: number): string {
  if (s >= 7) return '#ef4444'
  if (s >= 4) return '#fb923c'
  return '#eab308'
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
    const height = 520
    const isDark = document.documentElement.classList.contains('dark')
    const dotColor = isDark ? '#1f1f1f' : '#e5e7eb'
    const labelColor = isDark ? '#a3a3a3' : '#374151'
    const nodeFill = isDark ? '#0a0a0a' : '#ffffff'

    svg.attr('viewBox', `0 0 ${width} ${height}`)

    // ───── Defs: drop shadow + arrowheads ─────
    const defs = svg.append('defs')

    const filter = defs.append('filter')
      .attr('id', 'node-shadow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%')
    filter.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', 3)
    filter.append('feOffset').attr('dx', 0).attr('dy', 2).attr('result', 'offsetblur')
    filter.append('feComponentTransfer').append('feFuncA').attr('type', 'linear').attr('slope', 0.18)
    const merge = filter.append('feMerge')
    merge.append('feMergeNode')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    const colorScale = d3.scaleOrdinal<string, string>().range(isDark ? DOC_PALETTE_DARK : DOC_PALETTE_LIGHT)
    const strokeWidth = (severity: number) => 1 + (severity / 10) * 5

    const nodes: SimNode[] = graph.nodes.map(n => ({ ...n }))
    const nodeById = new Map(nodes.map(n => [n.id, n]))
    const links: SimLink[] = graph.edges.map((e: GraphEdge) => ({
      source: nodeById.get(e.source) ?? e.source,
      target: nodeById.get(e.target) ?? e.target,
      severity: e.severity,
      explanation: e.explanation,
    }))

    // Subtle background grid
    const bgPattern = defs.append('pattern')
      .attr('id', 'bg-dots')
      .attr('width', 24).attr('height', 24)
      .attr('patternUnits', 'userSpaceOnUse')
    bgPattern.append('circle').attr('cx', 1).attr('cy', 1).attr('r', 1).attr('fill', dotColor)
    svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'url(#bg-dots)').attr('opacity', 0.5)

    const g = svg.append('g')

    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => g.attr('transform', event.transform))
    )

    // Curved links
    const link = g.append('g')
      .selectAll<SVGPathElement, SimLink>('path')
      .data(links)
      .join('path')
      .attr('class', 'd3-link')
      .attr('fill', 'none')
      .attr('stroke', d => severityColor(d.severity))
      .attr('stroke-opacity', 0.55)
      .attr('stroke-width', d => strokeWidth(d.severity))
      .attr('stroke-linecap', 'round')
      .style('cursor', 'pointer')
      .on('mouseenter', function (_event, d) {
        d3.select(this).attr('stroke-opacity', 1).attr('stroke-width', strokeWidth(d.severity) + 1.5)
        onEdgeHover(d.explanation)
      })
      .on('mouseleave', function (_event, d) {
        d3.select(this).attr('stroke-opacity', 0.55).attr('stroke-width', strokeWidth(d.severity))
        onEdgeHover(null)
      })

    // Nodes with white halo + colored core
    const nodeG = g.append('g')
      .selectAll<SVGGElement, SimNode>('g')
      .data(nodes)
      .join('g')
      .attr('class', 'd3-node')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => onNodeClick(d))

    nodeG.append('circle')
      .attr('r', 18)
      .attr('fill', nodeFill)
      .attr('stroke', d => colorScale(d.doc))
      .attr('stroke-width', 1.5)
      .attr('filter', 'url(#node-shadow)')

    nodeG.append('circle')
      .attr('r', 7)
      .attr('fill', d => colorScale(d.doc))

    nodeG.append('text')
      .text(d => `${d.number}`)
      .attr('font-size', 10)
      .attr('font-weight', 600)
      .attr('text-anchor', 'middle')
      .attr('dy', 32)
      .attr('fill', labelColor)
      .attr('font-family', '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif')
      .style('pointer-events', 'none')

    nodeG.on('mouseenter', function () {
      d3.select(this).select('circle').transition().duration(150).attr('r', 22)
    }).on('mouseleave', function () {
      d3.select(this).select('circle').transition().duration(150).attr('r', 18)
    })

    const simulation = d3.forceSimulation<SimNode>(nodes)
      .force('link', d3.forceLink<SimNode, SimLink>(links).id(d => d.id).distance(160).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-380))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(28))
      .on('tick', () => {
        link.attr('d', d => {
          const s = d.source as SimNode
          const t = d.target as SimNode
          const dx = (t.x ?? 0) - (s.x ?? 0)
          const dy = (t.y ?? 0) - (s.y ?? 0)
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.6
          return `M${s.x},${s.y}A${dr},${dr} 0 0,1 ${t.x},${t.y}`
        })
        nodeG.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
      })

    nodeG.call(
      d3.drag<SVGGElement, SimNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x; d.fy = d.y
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null; d.fy = null
        })
    )

    return () => {
      simulation.stop()
      svg.selectAll('*').remove()
    }
  }, [graph, onNodeClick, onEdgeHover, svgRef])
}
