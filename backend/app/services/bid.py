from sqlalchemy.orm import Session
from app.models.bid import Bid
from app.schemas.bid import BidCreate, BidUpdate
from .base_service import CRUDBase

class BidService(CRUDBase[Bid, BidCreate, BidUpdate]):
    def create_bid(self, db: Session, bid_in: BidCreate, user):
        db_obj = Bid()
        setattr(db_obj, 'project_id', bid_in.project_id)
        setattr(db_obj, 'freelancer_id', bid_in.freelancer_id)
        setattr(db_obj, 'amount', bid_in.amount)
        setattr(db_obj, 'cover_letter', bid_in.cover_letter)
        setattr(db_obj, 'status', bid_in.status)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_bids(self, db: Session):
        return db.query(Bid).all()

    def update_bid(self, db: Session, bid_id: str, bid_in: BidUpdate, user):
        bid = db.query(Bid).filter(Bid.id == bid_id).first()
        if bid:
            for field, value in bid_in.dict(exclude_unset=True).items():
                setattr(bid, field, value)
            db.commit()
            db.refresh(bid)
        return bid

    def delete_bid(self, db: Session, bid_id: str, user):
        bid = db.query(Bid).filter(Bid.id == bid_id).first()
        if bid:
            db.delete(bid)
            db.commit()
        return None

bid = BidService(Bid)

# Export functions for backward compatibility
create_bid = bid.create_bid
get_bids = bid.get_bids
update_bid = bid.update_bid
delete_bid = bid.delete_bid 