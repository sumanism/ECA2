from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from backend.models import Flow, FlowStep, Segment
from backend.database import get_session
from pydantic import BaseModel

router = APIRouter()

class FlowStepCreate(BaseModel):
    step_type: str  # SEND_EMAIL | WAIT | SEND_PUSH | EXIT
    config: dict  # JSON config
    next_step_id: Optional[str] = None
    step_order: int

class FlowCreate(BaseModel):
    segment_id: str  # Required: flow targets a segment
    entry_condition_type: Optional[str] = None  # signup, first_purchase, cart_abandoned, order_completed, subscription_renewal
    entry_condition: Optional[str] = None
    name: Optional[str] = None
    steps: List[FlowStepCreate] = []

class FlowUpdate(BaseModel):
    entry_condition_type: Optional[str] = None
    entry_condition: Optional[str] = None
    name: Optional[str] = None

@router.get("/", response_model=List[Flow])
def get_flows(session: Session = Depends(get_session)):
    """Get all flows"""
    flows = session.exec(select(Flow)).all()
    return flows

@router.get("/{flow_id}", response_model=Flow)
def get_flow(flow_id: str, session: Session = Depends(get_session)):
    flow = session.get(Flow, flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return flow

@router.get("/{flow_id}/steps", response_model=List[FlowStep])
def get_flow_steps(flow_id: str, session: Session = Depends(get_session)):
    """Get all steps for a flow, ordered by step_order"""
    steps = session.exec(
        select(FlowStep)
        .where(FlowStep.flow_id == flow_id)
        .order_by(FlowStep.step_order)
    ).all()
    return steps

@router.post("/", response_model=Flow)
def create_flow(flow: FlowCreate, session: Session = Depends(get_session)):
    from backend.models import Segment
    
    # Verify segment exists
    segment = session.get(Segment, flow.segment_id)
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    db_flow = Flow(
        segment_id=flow.segment_id,
        entry_condition_type=flow.entry_condition_type,
        entry_condition=flow.entry_condition,
        name=flow.name
    )
    session.add(db_flow)
    session.commit()
    session.refresh(db_flow)
    
    # Create flow steps if provided
    if flow.steps:
        # Sort steps by step_order
        sorted_steps = sorted(flow.steps, key=lambda x: x.step_order)
        step_ids = []
        
        for step_data in sorted_steps:
            step = FlowStep(
                flow_id=db_flow.id,
                step_type=step_data.step_type,
                config=step_data.config,
                next_step_id=None,  # Will be set after all steps are created
                step_order=step_data.step_order
            )
            session.add(step)
            session.flush()  # Flush to get step ID
            step_ids.append(step.id)
        
        # Link steps together (each step points to the next one)
        for i in range(len(step_ids) - 1):
            step = session.get(FlowStep, step_ids[i])
            if step:
                step.next_step_id = step_ids[i + 1]
        
        session.commit()
    
    session.refresh(db_flow)
    return db_flow

@router.put("/{flow_id}", response_model=Flow)
def update_flow(flow_id: str, flow_update: FlowUpdate, session: Session = Depends(get_session)):
    flow = session.get(Flow, flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    update_data = flow_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(flow, key, value)
    
    session.add(flow)
    session.commit()
    session.refresh(flow)
    return flow

@router.post("/{flow_id}/steps", response_model=FlowStep)
def create_flow_step(flow_id: str, step: FlowStepCreate, session: Session = Depends(get_session)):
    """Create a new step in a flow"""
    flow = session.get(Flow, flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    db_step = FlowStep(
        flow_id=flow_id,
        step_type=step.step_type,
        config=step.config,
        next_step_id=step.next_step_id,
        step_order=step.step_order
    )
    session.add(db_step)
    session.commit()
    session.refresh(db_step)
    return db_step

@router.put("/{flow_id}/steps/{step_id}", response_model=FlowStep)
def update_flow_step(
    flow_id: str,
    step_id: str,
    step_update: FlowStepCreate,
    session: Session = Depends(get_session)
):
    """Update a flow step"""
    step = session.get(FlowStep, step_id)
    if not step or step.flow_id != flow_id:
        raise HTTPException(status_code=404, detail="Flow step not found")
    
    step.step_type = step_update.step_type
    step.config = step_update.config
    step.next_step_id = step_update.next_step_id
    step.step_order = step_update.step_order
    
    session.add(step)
    session.commit()
    session.refresh(step)
    return step

@router.delete("/{flow_id}/steps/{step_id}")
def delete_flow_step(flow_id: str, step_id: str, session: Session = Depends(get_session)):
    """Delete a flow step"""
    step = session.get(FlowStep, step_id)
    if not step or step.flow_id != flow_id:
        raise HTTPException(status_code=404, detail="Flow step not found")
    
    session.delete(step)
    session.commit()
    return {"message": "Flow step deleted successfully"}

@router.delete("/{flow_id}")
def delete_flow(flow_id: str, session: Session = Depends(get_session)):
    flow = session.get(Flow, flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # Delete associated steps
    steps = session.exec(select(FlowStep).where(FlowStep.flow_id == flow_id)).all()
    for step in steps:
        session.delete(step)
    
    session.delete(flow)
    session.commit()
    return {"message": "Flow deleted successfully"}
