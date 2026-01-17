from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from backend.models import User
from backend.database import get_session
from pydantic import BaseModel

router = APIRouter()

class UserCreate(BaseModel):
    email: str
    phone: Optional[str] = None
    first_name: str
    last_name: str
    marketing_opt_in: bool = True
    shipping_state: Optional[str] = None
    shipping_country: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    marketing_opt_in: Optional[bool] = None
    shipping_state: Optional[str] = None
    shipping_country: Optional[str] = None

@router.get("/", response_model=List[User])
def get_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    session: Session = Depends(get_session)
):
    statement = select(User)
    if search:
        statement = statement.where(
            (User.first_name.contains(search)) |
            (User.last_name.contains(search)) |
            (User.email.contains(search))
        )
    statement = statement.offset(skip).limit(limit)
    users = session.exec(statement).all()
    return users

@router.get("/{user_id}", response_model=User)
def get_user(user_id: str, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/", response_model=User)
def create_user(user: UserCreate, session: Session = Depends(get_session)):
    # Check if email already exists
    existing = session.exec(select(User).where(User.email == user.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    db_user = User(**user.dict())
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=User)
def update_user(user_id: str, user_update: UserUpdate, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(user_id: str, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    session.delete(user)
    session.commit()
    return {"message": "User deleted successfully"}
