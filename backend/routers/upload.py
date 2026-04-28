import uuid
import os
import fitz
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from models.schemas import UploadResponse, UploadedFile
from services.extractor import extract_clauses
from services.embeddings import generate_embeddings
from services.vector_store import store_clauses

router = APIRouter()

MAX_FILES = int(os.getenv("MAX_FILES", "5"))
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "20"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


@router.post("/upload", response_model=UploadResponse)
async def upload_files(files: List[UploadFile] = File(...)):
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_FILES} files allowed")

    session_id = str(uuid.uuid4())
    uploaded = []
    all_clauses = []

    for file in files:
        filename = file.filename or ""
        if not filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{filename} is not a PDF")

        content = await file.read()
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=400, detail=f"{filename} exceeds {MAX_FILE_SIZE_MB}MB limit")

        doc_id = str(uuid.uuid4())
        clauses = extract_clauses(content, doc_id, filename)

        doc = fitz.open(stream=content, filetype="pdf")
        pages = len(doc)
        doc.close()

        all_clauses.extend(clauses)
        uploaded.append(UploadedFile(name=filename, pages=pages, status="ok"))

    if all_clauses:
        embeddings = generate_embeddings(all_clauses)
        store_clauses(session_id, all_clauses, embeddings)

    return UploadResponse(session_id=session_id, files=uploaded)
