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
