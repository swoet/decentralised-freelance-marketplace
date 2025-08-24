from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate
from app.services.user import user
from app.core.auth import create_access_token
from app.api.deps import get_db
from datetime import timedelta


router = APIRouter(prefix="/auth", tags=["auth"])


from typing import Dict, Any

@router.post("/register")
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        print(f"Registration attempt for email: {user_in.email}")
        # Check if user already exists
        existing_user = user.get_by_email(db, email=user_in.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        print("Creating user...")
        user_obj = user.create(db, obj_in=user_in)
        print(f"User created with ID: {user_obj.id}")
        token = create_access_token(subject=str(user_obj.id), expires_delta=timedelta(minutes=60))
        print("Access token created")
        return {
            "token": token,
            "user": {
                "id": str(user_obj.id),
                "email": user_obj.email or "",
                "full_name": user_obj.full_name or "",
                "role": user_obj.role or "client",
            },
        }
    except HTTPException as e:
        # Pass through HTTPExceptions
        raise e
    except Exception as e:
        import traceback
        print("Registration error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Dict[str, Any]:
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