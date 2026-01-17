from typing import List
from backend.models import Campaign, CampaignStep, User, Segment
from sqlmodel import Session, select
from backend.services.logging import logger

def evaluate_segment(segment: Segment, users: List[User]) -> List[User]:
    """Evaluate segment criteria against users"""
    from datetime import datetime, timedelta
    
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
                    if user.last_order_date:
                        days_diff = (datetime.utcnow() - user.last_order_date).days
                    else:
                        days_diff = 999999
                    user_value = days_diff
                else:
                    if isinstance(value, str) and value.startswith("relative_"):
                        days_ago = int(value.split("_")[1])
                        cutoff_date = datetime.utcnow() - timedelta(days=days_ago)
                        user_value = user.last_order_date or datetime.min
                        if operator == "lt":
                            criteria_results.append(user_value > cutoff_date)
                        elif operator == "gt":
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
    
    return matching_users

def execute_campaign(campaign_id: str, session: Session):
    """Execute a campaign by sending emails to segment members"""
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise ValueError(f"Campaign {campaign_id} not found")
    
    if campaign.status != "active":
        raise ValueError(f"Campaign {campaign_id} is not active")
    
    # Get segment
    segment = session.get(Segment, campaign.segment_id)
    if not segment:
        raise ValueError(f"Segment {campaign.segment_id} not found")
    
    # Get all users
    users = session.exec(select(User)).all()
    
    # Evaluate segment
    target_users = evaluate_segment(segment, users)
    
    # Get campaign steps
    steps = session.exec(
        select(CampaignStep)
        .where(CampaignStep.campaign_id == campaign_id)
        .order_by(CampaignStep.step_number)
    ).all()
    
    logger.info(f"Executing campaign {campaign.name} for {len(target_users)} users with {len(steps)} steps")
    
    # In a real implementation, this would:
    # 1. Schedule emails based on delay_days
    # 2. Send emails via email service
    # 3. Track delivery stats
    
    return {
        "campaign_id": campaign_id,
        "users_targeted": len(target_users),
        "steps": len(steps),
        "status": "scheduled"
    }
