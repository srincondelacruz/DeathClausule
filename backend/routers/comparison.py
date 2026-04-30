from fastapi import APIRouter, HTTPException
from models.schemas import ComparisonResponse, Clause
from services.vector_store import get_or_create_collection
from services.comparison import compare_contracts

router = APIRouter()
comparison_store: dict = {}


@router.post("/compare/{session_id}", response_model=ComparisonResponse)
def compare(session_id: str):
    collection = get_or_create_collection(session_id)
    if collection.count() == 0:
        raise HTTPException(status_code=404, detail="Session not found or empty")

    all_docs = collection.get(include=["documents", "metadatas"])
    clauses: list[Clause] = []
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

    doc_ids = list(dict.fromkeys(c.doc_id for c in clauses))
    if len(doc_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 documents required for comparison")

    clauses_a = [c for c in clauses if c.doc_id == doc_ids[0]]
    clauses_b = [c for c in clauses if c.doc_id == doc_ids[1]]

    result = compare_contracts(session_id, clauses_a, clauses_b)
    comparison_store[session_id] = result
    return result
