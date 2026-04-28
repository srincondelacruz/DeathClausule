import fitz  # PyMuPDF
import json
import uuid
import os
from openai import AzureOpenAI
from models.schemas import Clause


def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages_text = []
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text()
        if text.strip():
            pages_text.append(f"[PAGE {page_num}]\n{text}")
    return "\n\n".join(pages_text)


def chunk_into_clauses(text: str, doc_id: str, doc_name: str) -> list[Clause]:
    client = AzureOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT", ""),
        api_key=os.getenv("AZURE_OPENAI_API_KEY", ""),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
    )
    prompt = """You are a legal document parser. Extract all clauses from the following contract text.
Return a JSON object with a "clauses" array. Each clause must have:
- "number": clause identifier (e.g. "1", "2.1", "3.a")
- "title": clause title or heading (empty string if none)
- "text": complete clause body text
- "page": page number where the clause starts (use the [PAGE N] markers)

Rules:
- Keep each clause complete. Do not split a clause into multiple entries.
- Do not merge separate clauses into one entry.
- If a clause spans multiple pages, use the page where it starts.
- Ignore headers, footers, signatures, and table of contents.

Contract text:
""" + text

    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT_GPT4O", "gpt-4o"),
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0,
    )
    data = json.loads(response.choices[0].message.content or "{}")
    clauses = []
    for item in data.get("clauses", []):
        clauses.append(Clause(
            id=str(uuid.uuid4()),
            doc_id=doc_id,
            doc_name=doc_name,
            clause_number=item.get("number", ""),
            clause_title=item.get("title", ""),
            text=item.get("text", ""),
            page=item.get("page", 1),
        ))
    return clauses


def extract_clauses(file_bytes: bytes, doc_id: str, doc_name: str) -> list[Clause]:
    text = extract_text_from_pdf(file_bytes)
    return chunk_into_clauses(text, doc_id, doc_name)
