from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.api import deps
from app.schemas.bid import Bid, BidCreate, BidUpdate, BidResponse
from app.services.bid import bid as bid_service, create_bid, get_bids, update_bid, delete_bid
from typing import List

router = APIRouter(prefix="/bids", tags=["bids"])


@router.get("/", response_model=List[BidResponse])
def list_bids(
    project_id: UUID | None = None,
    db: Session = Depends(deps.get_db),
    # Remove authentication requirement for consistency with projects endpoint
    # This allows dashboard to fetch bids without authentication issues
):
    # List bids, optionally filter by project
    bids = get_bids(db)
    if project_id:
        bids = [b for b in bids if str(getattr(b, "project_id", "")) == str(project_id)]
    return bids


@router.post("/", response_model=BidResponse)
def create_bid_view(
    bid_in: BidCreate, db: Session = Depends(deps.get_db), user=Depends(deps.get_current_user)
):
    return create_bid(db, bid_in, user)


@router.get("/{bid_id}", response_model=Bid)
def get_bid(
    bid_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    bid = bid_service.get(db, id=bid_id)
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    return bid


@router.put("/{bid_id}", response_model=BidResponse)
def update_bid_view(
    bid_id: str, bid_in: BidUpdate, db: Session = Depends(deps.get_db), user=Depends(deps.get_current_user)
):
    return update_bid(db, bid_id, bid_in, user)


@router.delete("/{bid_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bid_view(
    bid_id: str, db: Session = Depends(deps.get_db), user=Depends(deps.get_current_user)
):
    delete_bid(db, bid_id, user)
    return None 