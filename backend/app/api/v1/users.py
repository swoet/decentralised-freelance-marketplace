from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.user import user, get_user_by_id
from app.api.deps import get_db, get_current_active_user
from typing import List

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse)
def create_user_view(user_in: UserCreate, db: Session = Depends(get_db)):
    return user.create(db, obj_in=user_in)

@router.get("/me", response_model=UserResponse)
def get_me(user=Depends(get_current_active_user)):
    return user

@router.get("/", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return user.get_multi(db)

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    return get_user_by_id(db, user_id)

@router.put("/{user_id}", response_model=UserResponse)
def update_user_view(user_id: str, user_in: UserUpdate, db: Session = Depends(get_db), user_obj=Depends(get_current_active_user)):
    return user.update(db, db_obj=user.get_user_by_id(db, user_id), obj_in=user_in)

@router.delete("/{user_id}", status_code=204)
def delete_user_view(user_id: str, db: Session = Depends(get_db), user_obj=Depends(get_current_active_user)):
    user.remove(db, db_obj=user.get_user_by_id(db, user_id))
    return None 