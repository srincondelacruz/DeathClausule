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
