from fastapi import APIRouter, HTTPException
from models.schemas import ChatRequest, ChatResponse, ChatMessage
from services.vector_store import get_or_create_collection
from services.comparison import chat_with_contracts

router = APIRouter()
chat_store: dict[str, list[ChatMessage]] = {}


@router.post("/chat/{session_id}", response_model=ChatResponse)
def chat(session_id: str, request: ChatRequest):
    collection = get_or_create_collection(session_id)
    if collection.count() == 0:
        raise HTTPException(status_code=404, detail="Session not found or empty")

    history = chat_store.get(session_id, [])
    reply, sources = chat_with_contracts(session_id, request.message, history)

    history.append(ChatMessage(role="user", content=request.message))
    history.append(ChatMessage(role="assistant", content=reply))
    chat_store[session_id] = history

    return ChatResponse(reply=reply, sources=sources)
