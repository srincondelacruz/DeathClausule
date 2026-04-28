import json
import uuid
import chromadb
from unittest.mock import patch, MagicMock
from models.schemas import Clause


def _make_clause(doc_id: str, clause_id: str | None = None) -> Clause:
    return Clause(
        id=clause_id or str(uuid.uuid4()),
        doc_id=doc_id,
        doc_name=f"doc_{doc_id[:4]}.pdf",
        clause_number="1",
        clause_title="Term",
        text="The contract term is 12 months.",
        page=1,
    )


def _mock_embeddings_response(n: int) -> MagicMock:
    items = [MagicMock(embedding=[0.1, 0.2, 0.3]) for _ in range(n)]
    response = MagicMock()
    response.data = items
    return response


def _mock_contradiction_response(contradiction: bool, severity: int = 0) -> MagicMock:
    choice = MagicMock()
    choice.message.content = json.dumps({
        "contradiction": contradiction,
        "explanation": "They conflict." if contradiction else "No conflict.",
        "severity": severity,
    })
    response = MagicMock()
    response.choices = [choice]
    return response


def test_pair_deduplication():
    doc_a = str(uuid.uuid4())
    doc_b = str(uuid.uuid4())
    clause_a = _make_clause(doc_a)
    clause_b = _make_clause(doc_b)
    session_id = "test_dedup"

    with patch("services.embeddings.AzureOpenAI") as mock_emb_az, \
         patch("services.contradictions.AzureOpenAI") as mock_con_az, \
         patch("services.vector_store.chromadb.PersistentClient") as mock_chroma:

        ephemeral = chromadb.EphemeralClient()
        mock_chroma.return_value = ephemeral

        emb_client = MagicMock()
        mock_emb_az.return_value = emb_client
        emb_client.embeddings.create.return_value = _mock_embeddings_response(2)

        con_client = MagicMock()
        mock_con_az.return_value = con_client
        con_client.chat.completions.create.return_value = _mock_contradiction_response(True, severity=7)

        # Pre-populate collection so query_similar returns results
        col = ephemeral.get_or_create_collection(f"session_{session_id}", metadata={"hnsw:space": "cosine"})
        col.add(
            ids=[clause_a.id, clause_b.id],
            embeddings=[[0.1, 0.2, 0.3], [0.1, 0.2, 0.3]],
            documents=[clause_a.text, clause_b.text],
            metadatas=[
                {"doc_id": clause_a.doc_id, "doc_name": clause_a.doc_name,
                 "clause_number": clause_a.clause_number, "clause_title": clause_a.clause_title, "page": clause_a.page},
                {"doc_id": clause_b.doc_id, "doc_name": clause_b.doc_name,
                 "clause_number": clause_b.clause_number, "clause_title": clause_b.clause_title, "page": clause_b.page},
            ],
        )

        from services.contradictions import detect_contradictions
        edges, report = detect_contradictions(session_id, [clause_a, clause_b])

    # A-B pair should only appear once despite bidirectional checks
    assert len(edges) == 1
    assert edges[0].severity == 7
    assert len(report) == 1


def test_threshold_filters_distant_pairs():
    doc_a = str(uuid.uuid4())
    doc_b = str(uuid.uuid4())
    clause_a = _make_clause(doc_a)
    clause_b = _make_clause(doc_b)
    session_id = "test_threshold"

    with patch("services.embeddings.AzureOpenAI") as mock_emb_az, \
         patch("services.contradictions.AzureOpenAI") as mock_con_az, \
         patch("services.vector_store.chromadb.PersistentClient") as mock_chroma:

        ephemeral = chromadb.EphemeralClient()
        mock_chroma.return_value = ephemeral

        emb_client = MagicMock()
        mock_emb_az.return_value = emb_client
        emb_client.embeddings.create.return_value = _mock_embeddings_response(2)

        con_client = MagicMock()
        mock_con_az.return_value = con_client

        # Distance = 0.9 (far apart) — should be filtered out
        col = ephemeral.get_or_create_collection(f"session_{session_id}", metadata={"hnsw:space": "cosine"})
        col.add(
            ids=[clause_a.id, clause_b.id],
            embeddings=[[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]],
            documents=[clause_a.text, clause_b.text],
            metadatas=[
                {"doc_id": clause_a.doc_id, "doc_name": clause_a.doc_name,
                 "clause_number": clause_a.clause_number, "clause_title": clause_a.clause_title, "page": clause_a.page},
                {"doc_id": clause_b.doc_id, "doc_name": clause_b.doc_name,
                 "clause_number": clause_b.clause_number, "clause_title": clause_b.clause_title, "page": clause_b.page},
            ],
        )

        from services.contradictions import detect_contradictions
        edges, report = detect_contradictions(session_id, [clause_a, clause_b])

    # LLM should never have been called (distance > threshold)
    assert con_client.chat.completions.create.call_count == 0
    assert edges == []
    assert report == []
