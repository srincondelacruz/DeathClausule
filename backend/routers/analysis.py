import uuid
from fastapi import APIRouter, HTTPException
from models.schemas import AnalysisResponse, Clause, Graph, GraphNode, ResultsResponse
from services.vector_store import get_or_create_collection
from services.contradictions import detect_contradictions

router = APIRouter()

# In-memory store for MVP (lost on server restart)
analysis_store: dict = {}


@router.post("/analyze/{session_id}", response_model=AnalysisResponse)
def analyze(session_id: str):
    collection = get_or_create_collection(session_id)
    if collection.count() == 0:
        raise HTTPException(status_code=404, detail="Session not found or empty")

    all_docs = collection.get(include=["documents", "metadatas"])
    clauses = []
    for i, doc_id in enumerate(all_docs["ids"]):
        meta = all_docs["metadatas"][i]
        clauses.append(Clause(
            id=doc_id,
            doc_id=meta["doc_id"],
            doc_name=meta["doc_name"],
            clause_number=meta["clause_number"],
            clause_title=meta["clause_title"],
            text=all_docs["documents"][i],
            page=meta["page"],
        ))

    edges, report = detect_contradictions(session_id, clauses)

    nodes = {c.id: GraphNode(
        id=c.id,
        doc=c.doc_name,
        number=c.clause_number,
        title=c.clause_title,
        text=c.text,
    ) for c in clauses}

    node_ids = {e.source for e in edges} | {e.target for e in edges}
    graph_nodes = [nodes[nid] for nid in node_ids if nid in nodes]

    analysis_id = str(uuid.uuid4())
    analysis_store[analysis_id] = ResultsResponse(
        status="complete",
        graph=Graph(nodes=graph_nodes, edges=edges),
        report=report,
    )

    return AnalysisResponse(analysis_id=analysis_id, status="complete")
