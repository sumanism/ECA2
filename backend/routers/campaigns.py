from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from backend.models import Campaign, CampaignStep, Segment
from backend.database import get_session
from pydantic import BaseModel

router = APIRouter()

class CampaignCreate(BaseModel):
    segment_id: str
    flow_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    status: str = "draft"
    start_time: Optional[str] = None  # ISO format datetime string
    start_date: Optional[str] = None  # YYYY-MM-DD format
    start_time_of_day: Optional[str] = None  # HH:MM format

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    flow_id: Optional[str] = None
    status: Optional[str] = None
    start_time: Optional[str] = None
    start_date: Optional[str] = None
    start_time_of_day: Optional[str] = None

@router.get("/", response_model=List[Campaign])
def get_campaigns(session: Session = Depends(get_session)):
    campaigns = session.exec(select(Campaign)).all()
    return campaigns

@router.get("/{campaign_id}", response_model=Campaign)
def get_campaign(campaign_id: str, session: Session = Depends(get_session)):
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.get("/{campaign_id}/flow")
def get_campaign_flow(campaign_id: str, session: Session = Depends(get_session)):
    """Get the flow associated with a campaign"""
    from backend.models import Flow
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if not campaign.flow_id:
        raise HTTPException(status_code=404, detail="No flow associated with this campaign")
    flow = session.get(Flow, campaign.flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return flow

@router.post("/", response_model=Campaign)
def create_campaign(campaign: CampaignCreate, session: Session = Depends(get_session)):
    from datetime import datetime
    
    # Verify segment exists
    segment = session.get(Segment, campaign.segment_id)
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    # Verify flow exists if provided
    if campaign.flow_id:
        from backend.models import Flow
        flow = session.get(Flow, campaign.flow_id)
        if not flow:
            raise HTTPException(status_code=404, detail="Flow not found")
    
    start_time = None
    if campaign.start_time:
        try:
            # Handle ISO format datetime string (with or without timezone)
            if 'T' in campaign.start_time:
                # Remove timezone info if present and parse
                dt_str = campaign.start_time.replace('Z', '').split('+')[0]
                start_time = datetime.fromisoformat(dt_str)
            else:
                start_time = datetime.fromisoformat(campaign.start_time)
        except Exception as e:
            print(f"Error parsing start_time: {e}")
            start_time = None
    
    start_date = None
    if campaign.start_date:
        try:
            start_date = datetime.strptime(campaign.start_date, "%Y-%m-%d")
        except Exception as e:
            print(f"Error parsing start_date: {e}")
            start_date = None
    
    db_campaign = Campaign(
        segment_id=campaign.segment_id,
        flow_id=campaign.flow_id,
        name=campaign.name,
        description=campaign.description,
        status=campaign.status,
        start_time=start_time,
        start_date=start_date,
        start_time_of_day=campaign.start_time_of_day
    )
    session.add(db_campaign)
    session.commit()
    session.refresh(db_campaign)
    
    return db_campaign

@router.put("/{campaign_id}", response_model=Campaign)
def update_campaign(campaign_id: str, campaign_update: CampaignUpdate, session: Session = Depends(get_session)):
    from datetime import datetime
    
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    update_data = campaign_update.dict(exclude_unset=True)
    
    # Verify flow exists if being updated
    if 'flow_id' in update_data and update_data['flow_id']:
        from backend.models import Flow
        flow = session.get(Flow, update_data['flow_id'])
        if not flow:
            raise HTTPException(status_code=404, detail="Flow not found")
    
    # Handle start_time conversion
    if 'start_time' in update_data and update_data['start_time']:
        try:
            dt_str = update_data['start_time'].replace('Z', '').split('+')[0]
            update_data['start_time'] = datetime.fromisoformat(dt_str)
        except Exception as e:
            print(f"Error parsing start_time: {e}")
            update_data['start_time'] = None
    elif 'start_time' in update_data and update_data['start_time'] is None:
        update_data['start_time'] = None
    
    # Handle start_date conversion
    if 'start_date' in update_data and update_data['start_date']:
        try:
            update_data['start_date'] = datetime.strptime(update_data['start_date'], "%Y-%m-%d")
        except Exception as e:
            print(f"Error parsing start_date: {e}")
            update_data['start_date'] = None
    elif 'start_date' in update_data and update_data['start_date'] is None:
        update_data['start_date'] = None
    
    for key, value in update_data.items():
        setattr(campaign, key, value)
    
    session.add(campaign)
    session.commit()
    session.refresh(campaign)
    return campaign

@router.put("/{campaign_id}/status")
def update_campaign_status(campaign_id: str, status: str, session: Session = Depends(get_session)):
    """Update campaign status (active, paused, draft, completed)"""
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if status not in ['draft', 'active', 'paused', 'completed']:
        raise HTTPException(status_code=400, detail="Invalid status. Must be: draft, active, paused, or completed")
    
    campaign.status = status
    session.add(campaign)
    session.commit()
    session.refresh(campaign)
    return campaign

@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: str, session: Session = Depends(get_session)):
    from backend.models import Flow, FlowStep
    
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Delete associated flow and flow steps
    flow = session.exec(select(Flow).where(Flow.campaign_id == campaign_id)).first()
    if flow:
        flow_steps = session.exec(select(FlowStep).where(FlowStep.flow_id == flow.id)).all()
        for step in flow_steps:
            session.delete(step)
        session.delete(flow)
    
    # Delete old campaign steps if they exist
    steps = session.exec(select(CampaignStep).where(CampaignStep.campaign_id == campaign_id)).all()
    for step in steps:
        session.delete(step)
    
    session.delete(campaign)
    session.commit()
    return {"message": "Campaign deleted successfully"}
