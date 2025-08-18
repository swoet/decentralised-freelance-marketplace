from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.review import ReviewCreate, ReviewResponse
from app.services.review import create_review, get_reviews, delete_review
from app.api.deps import get_db, get_current_active_user
from typing import List


router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/", response_model=ReviewResponse)
def create_review_view(
    review_in: ReviewCreate, db: Session = Depends(get_db), user=Depends(get_current_active_user)
):
    return create_review(db, review_in, user)


@router.get("/", response_model=List[ReviewResponse])
def list_reviews(db: Session = Depends(get_db)):
    return get_reviews(db)


@router.delete("/{review_id}", status_code=204)
def delete_review_view(
    review_id: str, db: Session = Depends(get_db), user=Depends(get_current_active_user)
):
    delete_review(db, review_id, user)
    return None 