import os
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from openai import AzureOpenAI
from models.schemas import (
    Clause, GraphNode, SimilarPair,
    ComparisonResponse, ChatMessage,
)
from services.vector_store import get_or_create_collection, query_similar
from services.embeddings import generate_embeddings


def get_azure_client() -> AzureOpenAI:
    return AzureOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT", ""),
        api_key=os.getenv("AZURE_OPENAI_API_KEY", ""),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
    )


def _clause_to_node(c: Clause) -> GraphNode:
    return GraphNode(
        id=c.id,
        doc=c.doc_name,
        number=c.clause_number,
        title=c.clause_title,
        text=c.text,
    )


def _get_differences(clause: Clause, candidate: dict) -> str:
    client = get_azure_client()
    b_meta = candidate["metadata"]
    prompt = f"""Compare these two contract clauses and explain their differences concisely (2-3 sentences).
Focus on what each clause says differently, not on their similarities.

Clause A ({clause.doc_name}, {clause.clause_number}):
{clause.text}

Clause B ({b_meta.get('doc_name', '')}, {b_meta.get('clause_number', '')}):
{candidate['text']}

Return a JSON object with:
- "differences": explanation of how they differ
Respond in the same language as the clauses above.
"""
    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT_GPT4O", "gpt-4o"),
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0,
    )
    result = json.loads(response.choices[0].message.content or "{}")
    return result.get("differences", "")


def find_exclusive_and_similar(
    session_id: str,
    clauses_a: list[Clause],
    clauses_b: list[Clause],
) -> tuple[list[GraphNode], list[GraphNode], list[SimilarPair]]:
    MATCH_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.55"))
    distance_threshold = 1 - MATCH_THRESHOLD

    embeddings_a = generate_embeddings(clauses_a)
    matched_a: set[str] = set()
    matched_b: set[str] = set()
    checked_pairs: set[frozenset] = set()
    pending: list[tuple[Clause, dict]] = []

    for clause, embedding in zip(clauses_a, embeddings_a):
        candidates = query_similar(session_id, embedding, exclude_clause_id=clause.id, exclude_doc_id=clause.doc_id, top_n=3)
        for candidate in candidates:
            if candidate["distance"] > distance_threshold:
                continue
            pair = frozenset([clause.id, candidate["id"]])
            if pair in checked_pairs:
                continue
            checked_pairs.add(pair)
            matched_a.add(clause.id)
            matched_b.add(candidate["id"])
            pending.append((clause, candidate))

    similar_pairs: list[SimilarPair] = []
    if pending:
        with ThreadPoolExecutor(max_workers=min(10, len(pending))) as executor:
            futures = {executor.submit(_get_differences, clause, candidate): (clause, candidate) for clause, candidate in pending}
            for future in as_completed(futures):
                clause, candidate = futures[future]
                b_meta = candidate["metadata"]
                similar_pairs.append(SimilarPair(
                    clause_a=_clause_to_node(clause),
                    clause_b=GraphNode(
                        id=candidate["id"],
                        doc=b_meta.get("doc_name", ""),
                        number=b_meta.get("clause_number", ""),
                        title=b_meta.get("clause_title", ""),
                        text=candidate["text"],
                    ),
                    similarity_score=round(1 - candidate["distance"], 3),
                    differences=future.result(),
                ))

    exclusive_a = [_clause_to_node(c) for c in clauses_a if c.id not in matched_a]
    exclusive_b = [_clause_to_node(c) for c in clauses_b if c.id not in matched_b]
    return exclusive_a, exclusive_b, similar_pairs


def generate_executive_summary(
    doc_a: str,
    doc_b: str,
    exclusive_a: list[GraphNode],
    exclusive_b: list[GraphNode],
    similar_pairs: list[SimilarPair],
) -> str:
    client = get_azure_client()
    exclusive_a_text = "\n".join(f"- [{c.number}] {c.title}: {c.text[:200]}..." for c in exclusive_a[:5])
    exclusive_b_text = "\n".join(f"- [{c.number}] {c.title}: {c.text[:200]}..." for c in exclusive_b[:5])
    diffs_text = "\n".join(f"- {p.differences}" for p in similar_pairs[:5])

    prompt = f"""Eres un analista legal. Escribe un resumen ejecutivo conciso (3-5 párrafos) comparando dos contratos.
IMPORTANTE: Responde SIEMPRE en el mismo idioma en que están redactadas las cláusulas. Si las cláusulas están en español, responde en español.

Documento A: {doc_a}
Documento B: {doc_b}

Cláusulas exclusivas de {doc_a}:
{exclusive_a_text or 'Ninguna'}

Cláusulas exclusivas de {doc_b}:
{exclusive_b_text or 'Ninguna'}

Diferencias clave en cláusulas compartidas:
{diffs_text or 'Ninguna'}

Céntrate en: diferencias de alcance, protecciones ausentes, conflictos notables e implicaciones prácticas.
"""
    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT_GPT4O", "gpt-4o"),
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    return response.choices[0].message.content or ""


def compare_contracts(
    session_id: str,
    clauses_a: list[Clause],
    clauses_b: list[Clause],
) -> ComparisonResponse:
    doc_a = clauses_a[0].doc_name if clauses_a else "Document A"
    doc_b = clauses_b[0].doc_name if clauses_b else "Document B"

    exclusive_a, exclusive_b, similar_pairs = find_exclusive_and_similar(
        session_id, clauses_a, clauses_b
    )
    summary = generate_executive_summary(doc_a, doc_b, exclusive_a, exclusive_b, similar_pairs)

    return ComparisonResponse(
        doc_a=doc_a,
        doc_b=doc_b,
        exclusive_a=exclusive_a,
        exclusive_b=exclusive_b,
        similar_pairs=similar_pairs,
        executive_summary=summary,
    )


def chat_with_contracts(
    session_id: str,
    message: str,
    history: list[ChatMessage],
) -> tuple[str, list[GraphNode]]:
    client = get_azure_client()

    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_EMBEDDINGS", "text-embedding-3-small")
    embed_response = client.embeddings.create(model=deployment, input=[message])
    query_embedding = embed_response.data[0].embedding

    collection = get_or_create_collection(session_id)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(6, collection.count()),
    )

    sources: list[GraphNode] = []
    context_parts: list[str] = []
    for i, doc_id in enumerate(results["ids"][0]):
        meta = results["metadatas"][0][i]
        text = results["documents"][0][i]
        sources.append(GraphNode(
            id=doc_id,
            doc=meta.get("doc_name", ""),
            number=meta.get("clause_number", ""),
            title=meta.get("clause_title", ""),
            text=text,
        ))
        context_parts.append(
            f"[{meta.get('doc_name', '')} — Clause {meta.get('clause_number', '')}]\n{text}"
        )

    context = "\n\n---\n\n".join(context_parts)
    system_prompt = f"""You are a legal assistant specialized in contract analysis.
Answer questions based ONLY on the contract clauses provided below.
If asked to draft a recommendation or unified clause, do so based on both contracts.
Always cite which document and clause number you're referring to.
Respond in the same language as the user's question.

Contract clauses:
{context}
"""
    from openai.types.chat import ChatCompletionMessageParam
    chat_messages: list[ChatCompletionMessageParam] = [
        {"role": "system", "content": system_prompt}
    ]
    for msg in history[-6:]:
        chat_messages.append({"role": msg.role, "content": msg.content})  # type: ignore[typeddict-item,arg-type,misc]
    chat_messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT_GPT4O", "gpt-4o"),
        messages=chat_messages,
        temperature=0.3,
    )
    reply = response.choices[0].message.content or ""
    return reply, sources
