from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate
from app.services.user import user
from app.core.auth import create_access_token, generate_2fa_secret, verify_2fa_token
from app.api.deps import get_db
from datetime import timedelta


router = APIRouter(prefix="/auth", tags=["auth"])


from typing import Dict, Any

@router.post("/register")
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        existing_user = user.get_by_email(db, email=user_in.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Dict[str, Any]:
    user_obj = user.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user_obj:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")
    # If 2FA is enabled, instruct client to use JSON login with OTP
    if getattr(user_obj, 'two_fa_enabled', False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="2FA required. Use /auth/login with OTP.")
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


class JsonLogin(BaseModel):
    email: EmailStr
    password: str
    otp: str | None = None


@router.post("/login")
def json_login(payload: JsonLogin, db: Session = Depends(get_db)) -> Dict[str, Any]:
    user_obj = user.authenticate_user(db, email=payload.email, password=payload.password)
    if not user_obj:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")
    if getattr(user_obj, 'two_fa_enabled', False):
        if not payload.otp:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="OTP required")
        # verify
        secret = getattr(user_obj, 'two_fa_secret', None)
        if not secret or not verify_2fa_token(secret, payload.otp):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
    token = create_access_token(subject=str(user_obj.id), expires_delta=timedelta(minutes=60))
    return {
        "token": token,
        "user": {
            "id": str(user_obj.id),
            "email": user_obj.email or "",
            "full_name": user_obj.full_name or "",
            "role": user_obj.role or "client",
            "two_fa_enabled": bool(getattr(user_obj, 'two_fa_enabled', False)),
        },
    }


class TwoFAEnrollResp(BaseModel):
    secret: str
    otpauth_uri: str


@router.post("/2fa/enroll", response_model=TwoFAEnrollResp)
def twofa_enroll(db: Session = Depends(get_db), form: OAuth2PasswordRequestForm = Depends()):
    # Reauthenticate user with credentials before showing secret
    user_obj = user.authenticate_user(db, email=form.form_data['username'] if hasattr(form, 'form_data') else form.username, password=form.password)
    if not user_obj:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    secret = generate_2fa_secret()
    # Save secret but don't enable until verification
    setattr(user_obj, 'two_fa_secret', secret)
    db.add(user_obj)
    db.commit()
    issuer = "FreelanceX"
    label = f"{issuer}:{user_obj.email}"
    otpauth_uri = f"otpauth://totp/{label}?secret={secret}&issuer={issuer}"
    return TwoFAEnrollResp(secret=secret, otpauth_uri=otpauth_uri)


class TwoFAVerifyReq(BaseModel):
    email: EmailStr
    otp: str


@router.post("/2fa/verify")
def twofa_verify(body: TwoFAVerifyReq, db: Session = Depends(get_db)):
    user_obj = user.get_by_email(db, email=body.email)
    if not user_obj or not getattr(user_obj, 'two_fa_secret', None):
        raise HTTPException(status_code=400, detail="2FA not enrolled")
    if not verify_2fa_token(user_obj.two_fa_secret, body.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")
    setattr(user_obj, 'two_fa_enabled', True)
    db.add(user_obj)
    db.commit()
    return {"ok": True}


class TwoFADisableReq(BaseModel):
    email: EmailStr
    otp: str


@router.delete("/2fa")
def twofa_disable(body: TwoFADisableReq, db: Session = Depends(get_db)):
    user_obj = user.get_by_email(db, email=body.email)
    if not user_obj or not getattr(user_obj, 'two_fa_enabled', False):
        raise HTTPException(status_code=400, detail="2FA not enabled")
    if not verify_2fa_token(user_obj.two_fa_secret or "", body.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")
    setattr(user_obj, 'two_fa_enabled', False)
    setattr(user_obj, 'two_fa_secret', None)
    db.add(user_obj)
    db.commit()
    return {"ok": True} 