import uuid
import pytest
import chromadb
from unittest.mock import patch
from models.schemas import Clause


def _make_clause(doc_id: str) -> Clause:
    return Clause(
        id=str(uuid.uuid4()),
        doc_id=doc_id,
        doc_name="doc_a.pdf",
        clause_number="1",
        clause_title="Term",
        text="The contract term is 12 months.",
        page=1,
    )


@pytest.fixture
def ephemeral_collection():
    client = chromadb.EphemeralClient()
    collection = client.get_or_create_collection("test_session", metadata={"hnsw:space": "cosine"})
    return client, collection


def test_store_and_query(ephemeral_collection):
    client, collection = ephemeral_collection
    session_id = "test_session_store"

    doc_id_a = str(uuid.uuid4())
    doc_id_b = str(uuid.uuid4())
    clause_a = _make_clause(doc_id_a)
    clause_b = Clause(
        id=str(uuid.uuid4()),
        doc_id=doc_id_b,
        doc_name="doc_b.pdf",
        clause_number="2",
        clause_title="Payment",
        text="Payment is due in 60 days.",
        page=1,
    )
    emb_a = [0.1, 0.2, 0.3]
    emb_b = [0.1, 0.2, 0.31]

    with patch("services.vector_store.chromadb.PersistentClient") as mock_client_cls:
        ephemeral = chromadb.EphemeralClient()
        mock_client_cls.return_value = ephemeral

        from services.vector_store import store_clauses, query_similar

        store_clauses(session_id, [clause_a, clause_b], [emb_a, emb_b])
        results = query_similar(session_id, emb_a, exclude_doc_id=doc_id_a, top_n=5)

    assert len(results) == 1
    assert results[0]["id"] == clause_b.id


def test_delete_collection_no_error():
    with patch("services.vector_store.chromadb.PersistentClient") as mock_client_cls:
        ephemeral = chromadb.EphemeralClient()
        mock_client_cls.return_value = ephemeral

        from services.vector_store import delete_collection
        delete_collection("nonexistent_session")  # must not raise
