from typing import Optional

from sqlalchemy.orm import Session

from app.core.auth import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from .base_service import CRUDBase


class UserService(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        print("Starting user creation in service...")
        db_obj = User()
        setattr(db_obj, 'email', str(obj_in.email))
        setattr(db_obj, 'hashed_password', get_password_hash(obj_in.password))
        setattr(db_obj, 'role', str(obj_in.role))
        setattr(db_obj, 'full_name', obj_in.full_name)
        setattr(db_obj, 'wallet_address', obj_in.wallet_address)
        db.add(db_obj)
        print("About to commit user to database...")
        db.commit()
        print("User committed to database")
        db.refresh(db_obj)
        return db_obj

    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        user_obj = self.get_by_email(db, email=email)
        if not user_obj:
            return None
        hashed_password = getattr(user_obj, 'hashed_password', None)
        if not hashed_password or not verify_password(password, hashed_password):
            return None
        return user_obj

    def get_user_by_id(self, db: Session, user_id):
        return db.query(User).filter(User.id == user_id).first()


user = UserService(User)
get_user_by_id = user.get_user_by_id 