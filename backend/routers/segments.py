from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from datetime import datetime
from backend.models import Segment, User
from backend.database import get_session
from pydantic import BaseModel

router = APIRouter()

class SegmentCreate(BaseModel):
    name: str
    description: str = None
    definition: dict = {}

class SegmentUpdate(BaseModel):
    name: str = None
    description: str = None
    definition: dict = None

@router.get("/", response_model=List[Segment])
def get_segments(session: Session = Depends(get_session)):
    segments = session.exec(select(Segment)).all()
    return segments

@router.get("/{segment_id}", response_model=Segment)
def get_segment(segment_id: str, session: Session = Depends(get_session)):
    segment = session.get(Segment, segment_id)
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    return segment

@router.post("/", response_model=Segment)
def create_segment(segment: SegmentCreate, session: Session = Depends(get_session)):
    db_segment = Segment(**segment.dict())
    session.add(db_segment)
    session.commit()
    session.refresh(db_segment)
    return db_segment

@router.put("/{segment_id}", response_model=Segment)
def update_segment(segment_id: str, segment_update: SegmentUpdate, session: Session = Depends(get_session)):
    segment = session.get(Segment, segment_id)
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    update_data = segment_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(segment, key, value)
    
    session.add(segment)
    session.commit()
    session.refresh(segment)
    return segment

@router.delete("/{segment_id}")
def delete_segment(segment_id: str, session: Session = Depends(get_session)):
    segment = session.get(Segment, segment_id)
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    session.delete(segment)
    session.commit()
    return {"message": "Segment deleted successfully"}

@router.get("/{segment_id}/count")
def get_segment_count(segment_id: str, session: Session = Depends(get_session)):
    """Get count of users matching segment criteria"""
    from backend.services.campaign_executor import evaluate_segment
    
    segment = session.get(Segment, segment_id)
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    users = session.exec(select(User)).all()
    matching_users = evaluate_segment(segment, users)
    
    return {"segment_id": segment_id, "count": len(matching_users)}

@router.get("/{segment_id}/users")
def get_segment_users(segment_id: str, limit: int = 100, session: Session = Depends(get_session)):
    """Get users matching segment criteria with relevant columns"""
    from backend.services.campaign_executor import evaluate_segment
    
    segment = session.get(Segment, segment_id)
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    users = session.exec(select(User)).all()
    matching_users = evaluate_segment(segment, users)
    
    # Get the most relevant columns based on segment criteria
    criteria_fields = []
    if segment.definition and segment.definition.get("criteria"):
        criteria_fields = [c.get("field") for c in segment.definition.get("criteria", [])]
    
    # Always include name (combined first_name + last_name), email, and the most relevant field from criteria
    # We'll show: name, email, and one criteria field
    display_columns = ["name", "email"]
    criteria_field = None
    
    if criteria_fields:
        # Get the first criteria field that's meaningful to display
        for field in criteria_fields:
            if field not in ["first_name", "last_name", "email"] and hasattr(User, field):
                criteria_field = field
                display_columns.append(field)
                break
    
    # Limit to 3 columns total
    display_columns = display_columns[:3]
    
    # Format user data
    user_data = []
    for user in matching_users[:limit]:
        user_dict: dict = {
            "id": user.id,
            "name": f"{user.first_name} {user.last_name}",
            "email": user.email,
        }
        
        # Add the criteria field if we have one
        if criteria_field and hasattr(user, criteria_field):
            value = getattr(user, criteria_field)
            if isinstance(value, datetime):
                value = value.isoformat()
            elif value is None:
                value = "-"
            user_dict[criteria_field] = value
        
        user_data.append(user_dict)
    
    return {
        "segment_id": segment_id,
        "total_count": len(matching_users),
        "users": user_data,
        "columns": display_columns
    }

@router.post("/{segment_id}/evaluate")
def evaluate_segment(segment_id: str, session: Session = Depends(get_session)):
    from datetime import datetime, timedelta
    from backend.models import Order
    
    segment = session.get(Segment, segment_id)
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    users = session.exec(select(User)).all()
    matching_users = []
    
    # Get logical operator (default to AND)
    logical_operator = segment.definition.get("logical_operator", "AND")
    criteria_list = segment.definition.get("criteria", [])
    
    # If old format (flat dict), convert to new format
    if not criteria_list and isinstance(segment.definition, dict):
        criteria_list = []
        for field, condition in segment.definition.items():
            if field not in ["logical_operator", "criteria"]:
                for op, op_value in condition.items():
                    criteria_list.append({
                        "field": field,
                        "operator": op,
                        "value": op_value
                    })
    
    for user in users:
        criteria_results = []
        
        for criterion in criteria_list:
            field = criterion.get("field")
            operator = criterion.get("operator")
            value = criterion.get("value")
            
            if not hasattr(user, field):
                criteria_results.append(False)
                continue
            
            user_value = getattr(user, field)
            
            # Handle date fields with relative dates
            if field == "last_order_date" or field == "days_since_last_order":
                if field == "days_since_last_order":
                    # Calculate days since last order
                    if user.last_order_date:
                        days_diff = (datetime.utcnow() - user.last_order_date).days
                    else:
                        days_diff = 999999  # No order = very old
                    user_value = days_diff
                else:
                    # Handle relative date values
                    if isinstance(value, str) and value.startswith("relative_"):
                        # value format: "relative_30" means 30 days ago
                        days_ago = int(value.split("_")[1])
                        cutoff_date = datetime.utcnow() - timedelta(days=days_ago)
                        user_value = user.last_order_date or datetime.min
                        if operator == "lt":  # Less than X days ago = more recent
                            criteria_results.append(user_value > cutoff_date)
                        elif operator == "gt":  # More than X days ago = older
                            criteria_results.append(user_value < cutoff_date)
                        continue
                    user_value = user_value or datetime.min
            
            # Evaluate criteria
            if operator == "gt":
                criteria_results.append(user_value > value)
            elif operator == "lt":
                criteria_results.append(user_value < value)
            elif operator == "eq":
                criteria_results.append(user_value == value)
            elif operator == "contains":
                criteria_results.append(str(value).lower() in str(user_value).lower())
            elif operator == "gte":
                criteria_results.append(user_value >= value)
            elif operator == "lte":
                criteria_results.append(user_value <= value)
            else:
                criteria_results.append(False)
        
        # Apply logical operator
        if logical_operator == "OR":
            matches = any(criteria_results) if criteria_results else False
        else:  # AND (default)
            matches = all(criteria_results) if criteria_results else False
        
        if matches:
            matching_users.append(user)
    
    return {"segment_id": segment_id, "matching_users_count": len(matching_users), "users": matching_users}
