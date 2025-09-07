from fastapi import APIRouter

router = APIRouter()

@router.get("")
def marketplace_index():
    return {"items": []}
