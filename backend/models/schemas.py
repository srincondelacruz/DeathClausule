from pydantic import BaseModel
from typing import List


class Clause(BaseModel):
    id: str
    doc_id: str
    doc_name: str
    clause_number: str
    clause_title: str
    text: str
    page: int


class UploadedFile(BaseModel):
    name: str
    pages: int
    status: str  # "ok" | "error"


class UploadResponse(BaseModel):
    session_id: str
    files: List[UploadedFile]


class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str  # "processing" | "complete" | "error"


class GraphNode(BaseModel):
    id: str
    doc: str
    number: str
    title: str
    text: str


class GraphEdge(BaseModel):
    source: str
    target: str
    severity: int
    explanation: str


class Graph(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class ReportEntry(BaseModel):
    clause_a: GraphNode
    clause_b: GraphNode
    explanation: str
    severity: int


class ResultsResponse(BaseModel):
    status: str
    graph: Graph
    report: List[ReportEntry]


# --- Comparison schemas ---

class ExclusiveClause(BaseModel):
    clause: GraphNode
    doc: str

class SimilarPair(BaseModel):
    clause_a: GraphNode
    clause_b: GraphNode
    similarity_score: float
    differences: str

class ComparisonResponse(BaseModel):
    doc_a: str
    doc_b: str
    exclusive_a: List[GraphNode]
    exclusive_b: List[GraphNode]
    similar_pairs: List[SimilarPair]
    executive_summary: str


# --- Chat schemas ---

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    sources: List[GraphNode]
