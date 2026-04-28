import os
import json
from openai import AzureOpenAI
from models.schemas import Clause, GraphEdge, GraphNode, ReportEntry
from services.vector_store import query_similar
from services.embeddings import generate_embeddings


def get_azure_client() -> AzureOpenAI:
    return AzureOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT", ""),
        api_key=os.getenv("AZURE_OPENAI_API_KEY", ""),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
    )


def check_contradiction(clause_a: Clause, clause_b_text: str, clause_b_meta: dict) -> dict:
    client = get_azure_client()
    prompt = f"""You are a legal expert. Analyze whether these two clauses from different contracts are contradictory.

Clause A (from {clause_a.doc_name}, clause {clause_a.clause_number}):
{clause_a.text}

Clause B (from {clause_b_meta.get('doc_name', '')}, clause {clause_b_meta.get('clause_number', '')}):
{clause_b_text}

Return a JSON object with:
- "contradiction": true if the clauses contradict each other, false otherwise
- "explanation": a clear explanation of why they do or do not contradict (1-3 sentences)
- "severity": integer from 1 to 10 (only relevant if contradiction is true, else 0)

A contradiction exists when following both clauses simultaneously is impossible or creates a legal conflict.
"""
    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT_GPT4O", "gpt-4o"),
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0,
    )
    return json.loads(response.choices[0].message.content or "{}")


def detect_contradictions(session_id: str, clauses: list[Clause]) -> tuple[list[GraphEdge], list[ReportEntry]]:
    threshold = float(os.getenv("SIMILARITY_THRESHOLD", "0.75"))
    distance_threshold = 1 - threshold

    embeddings = generate_embeddings(clauses)

    checked_pairs: set[frozenset] = set()
    edges: list[GraphEdge] = []
    report: list[ReportEntry] = []

    for clause, embedding in zip(clauses, embeddings):
        similar = query_similar(session_id, embedding, exclude_doc_id=clause.doc_id)
        for candidate in similar:
            if candidate["distance"] > distance_threshold:
                continue
            pair = frozenset([clause.id, candidate["id"]])
            if pair in checked_pairs:
                continue
            checked_pairs.add(pair)

            result = check_contradiction(clause, candidate["text"], candidate["metadata"])
            if result.get("contradiction"):
                severity = int(result.get("severity", 5))
                explanation = result.get("explanation", "")

                node_a = GraphNode(
                    id=clause.id,
                    doc=clause.doc_name,
                    number=clause.clause_number,
                    title=clause.clause_title,
                    text=clause.text,
                )
                node_b = GraphNode(
                    id=candidate["id"],
                    doc=candidate["metadata"].get("doc_name", ""),
                    number=candidate["metadata"].get("clause_number", ""),
                    title=candidate["metadata"].get("clause_title", ""),
                    text=candidate["text"],
                )
                edges.append(GraphEdge(
                    source=clause.id,
                    target=candidate["id"],
                    severity=severity,
                    explanation=explanation,
                ))
                report.append(ReportEntry(
                    clause_a=node_a,
                    clause_b=node_b,
                    explanation=explanation,
                    severity=severity,
                ))

    report.sort(key=lambda x: x.severity, reverse=True)
    return edges, report
