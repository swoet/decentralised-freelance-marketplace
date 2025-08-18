from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserResponse
from app.services.user import user
from app.core.auth import create_access_token
from app.api.deps import get_db
from datetime import timedelta


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user_obj = user.create(db, obj_in=user_in)
    token = create_access_token(subject=str(user_obj.id), expires_delta=timedelta(minutes=60))
    return {
        "token": token,
        "user": {
            "id": str(user_obj.id),
            "email": user_obj.email or "",
            "full_name": user_obj.full_name or "",
            "role": user_obj.role or "client",
        },
    }


@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user_obj = user.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user_obj:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")
    access_token_expires = timedelta(minutes=60)
    token = create_access_token(subject=str(user_obj.id), expires_delta=access_token_expires)
    return {
        "token": token,
        "user": {
            "id": str(user_obj.id),
            "email": user_obj.email or "",
            "full_name": user_obj.full_name or "",
            "role": user_obj.role or "client",
        },
    }


# 2FA endpoints would go here (stub) 