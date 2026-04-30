from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import upload, analysis, results, comparison, chat  # noqa: E402

app = FastAPI(title="DeathClausule API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(analysis.router)
app.include_router(results.router)
app.include_router(comparison.router)
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok"}
