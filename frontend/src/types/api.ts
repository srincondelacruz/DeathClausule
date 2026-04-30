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
