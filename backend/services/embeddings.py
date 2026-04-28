import os
from openai import AzureOpenAI
from models.schemas import Clause


def get_azure_client() -> AzureOpenAI:
    return AzureOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT", ""),
        api_key=os.getenv("AZURE_OPENAI_API_KEY", ""),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
    )


def generate_embeddings(clauses: list[Clause]) -> list[list[float]]:
    client = get_azure_client()
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_EMBEDDINGS", "text-embedding-3-small")
    texts = [f"{c.clause_title}\n{c.text}" for c in clauses]
    response = client.embeddings.create(model=deployment, input=texts)
    return [item.embedding for item in response.data]
