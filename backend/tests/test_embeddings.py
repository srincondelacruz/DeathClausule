import uuid
from unittest.mock import patch, MagicMock
from models.schemas import Clause


def _make_clause(doc_id: str | None = None) -> Clause:
    return Clause(
        id=str(uuid.uuid4()),
        doc_id=doc_id or str(uuid.uuid4()),
        doc_name="test.pdf",
        clause_number="1",
        clause_title="Payment",
        text="Payment within 30 days.",
        page=1,
    )


@patch("services.embeddings.AzureOpenAI")
def test_generate_embeddings_returns_floats(mock_az):
    mock_client = MagicMock()
    mock_az.return_value = mock_client

    embedding_item = MagicMock()
    embedding_item.embedding = [0.1, 0.2, 0.3]
    mock_client.embeddings.create.return_value.data = [embedding_item]

    from services.embeddings import generate_embeddings
    clauses = [_make_clause()]
    result = generate_embeddings(clauses)

    assert len(result) == 1
    assert result[0] == [0.1, 0.2, 0.3]


@patch("services.embeddings.AzureOpenAI")
def test_generate_embeddings_multiple(mock_az):
    mock_client = MagicMock()
    mock_az.return_value = mock_client

    items = [MagicMock(embedding=[float(i)] * 3) for i in range(3)]
    mock_client.embeddings.create.return_value.data = items

    from services.embeddings import generate_embeddings
    clauses = [_make_clause() for _ in range(3)]
    result = generate_embeddings(clauses)

    assert len(result) == 3
    for i, emb in enumerate(result):
        assert emb == [float(i)] * 3
