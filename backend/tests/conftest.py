import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


@pytest.fixture
def mock_azure_client():
    with patch("openai.AzureOpenAI") as mock:
        yield mock
