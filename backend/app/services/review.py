from sqlalchemy.orm import Session
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewUpdate
from .base_service import CRUDBase

class ReviewService(CRUDBase[Review, ReviewCreate, ReviewUpdate]):
    def create_review(self, db: Session, review_in: ReviewCreate, user):
        db_obj = Review()
        setattr(db_obj, 'project_id', review_in.project_id)
        setattr(db_obj, 'reviewer_id', review_in.reviewer_id)
        setattr(db_obj, 'rating', review_in.rating)
        setattr(db_obj, 'comment', review_in.comment)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_reviews(self, db: Session):
        return db.query(Review).all()

    def delete_review(self, db: Session, review_id: str, user):
        review = db.query(Review).filter(Review.id == review_id).first()
        if review:
            db.delete(review)
            db.commit()
        return None

review = ReviewService(Review)

# Export functions for backward compatibility
create_review = review.create_review
get_reviews = review.get_reviews
delete_review = review.delete_review 