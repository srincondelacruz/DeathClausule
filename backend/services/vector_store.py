import os
import chromadb
from models.schemas import Clause


def get_client() -> chromadb.ClientAPI:
    persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
    return chromadb.PersistentClient(path=persist_dir)


def get_or_create_collection(session_id: str):
    client = get_client()
    return client.get_or_create_collection(
        name=f"session_{session_id}",
        metadata={"hnsw:space": "cosine"},
    )


def store_clauses(session_id: str, clauses: list[Clause], embeddings: list[list[float]]) -> None:
    collection = get_or_create_collection(session_id)
    collection.add(
        ids=[c.id for c in clauses],
        embeddings=embeddings,
        documents=[c.text for c in clauses],
        metadatas=[{
            "doc_id": c.doc_id,
            "doc_name": c.doc_name,
            "clause_number": c.clause_number,
            "clause_title": c.clause_title,
            "page": c.page,
        } for c in clauses],
    )


def query_similar(session_id: str, embedding: list[float], exclude_clause_id: str, exclude_doc_id: str | None = None, top_n: int = 10) -> list[dict]:
    collection = get_or_create_collection(session_id)
    count = collection.count()
    if count <= 1:
        return []
    where = {"doc_id": {"$ne": exclude_doc_id}} if exclude_doc_id else None
    query_kwargs: dict = {
        "query_embeddings": [embedding],
        "n_results": min(top_n + 1, count),
    }
    if where:
        query_kwargs["where"] = where
    results = collection.query(**query_kwargs)
    similar = []
    for i, doc_id in enumerate(results["ids"][0]):
        if doc_id == exclude_clause_id:
            continue
        similar.append({
            "id": doc_id,
            "text": results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
            "distance": results["distances"][0][i],
        })
    return similar[:top_n]


def delete_collection(session_id: str) -> None:
    client = get_client()
    try:
        client.delete_collection(f"session_{session_id}")
    except Exception:
        pass
