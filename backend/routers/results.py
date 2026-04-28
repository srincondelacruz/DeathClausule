from fastapi import APIRouter, HTTPException
from models.schemas import ResultsResponse
from routers.analysis import analysis_store

router = APIRouter()


@router.get("/results/{analysis_id}", response_model=ResultsResponse)
def get_results(analysis_id: str):
    result = analysis_store.get(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return result
