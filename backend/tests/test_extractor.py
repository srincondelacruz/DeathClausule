import json
import uuid
from unittest.mock import patch, MagicMock
import fitz


def _make_pdf_bytes() -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "1. Payment\nThe payment shall be made within 30 days.")
    buf = doc.tobytes()
    doc.close()
    return buf


def _mock_gpt_response(clauses_data: list) -> MagicMock:
    choice = MagicMock()
    choice.message.content = json.dumps({"clauses": clauses_data})
    response = MagicMock()
    response.choices = [choice]
    return response


@patch("services.extractor.AzureOpenAI")
def test_extract_clauses_returns_clause_list(mock_az):
    mock_client = MagicMock()
    mock_az.return_value = mock_client
    mock_client.chat.completions.create.return_value = _mock_gpt_response([
        {"number": "1", "title": "Payment", "text": "The payment shall be made within 30 days.", "page": 1},
    ])

    from services.extractor import extract_clauses
    doc_id = str(uuid.uuid4())
    clauses = extract_clauses(_make_pdf_bytes(), doc_id, "contract.pdf")

    assert len(clauses) == 1
    assert clauses[0].clause_number == "1"
    assert clauses[0].clause_title == "Payment"
    assert clauses[0].doc_id == doc_id
    assert clauses[0].doc_name == "contract.pdf"
    assert clauses[0].page == 1


@patch("services.extractor.AzureOpenAI")
def test_extract_clauses_empty_pdf(mock_az):
    mock_client = MagicMock()
    mock_az.return_value = mock_client
    mock_client.chat.completions.create.return_value = _mock_gpt_response([])

    from services.extractor import extract_clauses
    clauses = extract_clauses(_make_pdf_bytes(), str(uuid.uuid4()), "empty.pdf")
    assert clauses == []
