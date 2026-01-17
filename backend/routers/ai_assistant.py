"""
AI Assistant endpoints for segments, flows, and campaigns
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from backend.database import get_session
from backend.services.ai_service import (
    generate_segment_criteria,
    generate_flow_content,
    generate_flow_from_segment,
    generate_campaign_details as generate_campaign_details_ai,
    generate_suggestive_response
)
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter()

class SegmentBuildRequest(BaseModel):
    prompt: str  # Human language description

class FlowContentRequest(BaseModel):
    segment_description: str
    step_type: str
    step_number: int

class FlowGenerateRequest(BaseModel):
    segment_id: str
    segment_description: Optional[str] = None

class CampaignGenerateRequest(BaseModel):
    segment_id: str
    flow_id: Optional[str] = None
    segment_description: Optional[str] = None

class ChatRequest(BaseModel):
    prompt: str
    context: Optional[str] = None

@router.post("/segments/build")
def build_segment_from_prompt(request: SegmentBuildRequest):
    """Convert human language to segment criteria"""
    try:
        result = generate_segment_criteria(request.prompt)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating segment: {str(e)}")

@router.post("/flows/generate-content")
def generate_flow_step_content(request: FlowContentRequest):
    """Generate flow step content based on segment"""
    try:
        result = generate_flow_content(
            request.segment_description,
            request.step_type,
            request.step_number
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating flow content: {str(e)}")

@router.post("/flows/generate-from-segment")
def generate_flow_from_segment_endpoint(request: FlowGenerateRequest, session: Session = Depends(get_session)):
    """Generate complete flow based on segment conditions"""
    from backend.models import Segment
    
    segment = session.get(Segment, request.segment_id)
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    segment_description = request.segment_description or segment.name or segment.description or "Selected segment"
    segment_criteria = segment.definition or {}
    
    try:
        result = generate_flow_from_segment(segment_description, segment_criteria)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating flow: {str(e)}")

@router.post("/campaigns/generate")
def generate_campaign_details_endpoint(request: CampaignGenerateRequest, session: Session = Depends(get_session)):
    """Generate complete campaign setup based on segment and flow"""
    from backend.models import Segment, Flow, FlowStep
    
    segment = session.get(Segment, request.segment_id)
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    segment_description = request.segment_description or segment.name or segment.description or "Selected segment"
    segment_criteria = segment.definition or {}
    
    # Get flow data if flow_id is provided
    flow_data = None
    if request.flow_id:
        flow = session.get(Flow, request.flow_id)
        if flow:
            # Get flow steps
            steps = session.exec(
                select(FlowStep)
                .where(FlowStep.flow_id == flow.id)
                .order_by(FlowStep.step_order)
            ).all()
            
            # Safely serialize step configs
            steps_data = []
            for step in steps:
                step_config = step.config
                # Ensure config is a dict (handle JSON types)
                if hasattr(step_config, '__dict__'):
                    step_config = dict(step_config)
                elif not isinstance(step_config, dict):
                    try:
                        import json
                        step_config = json.loads(str(step_config)) if step_config else {}
                    except:
                        step_config = {}
                
                steps_data.append({
                    "step_type": step.step_type or "SEND_EMAIL",
                    "step_order": step.step_order or 1,
                    "config": step_config
                })
            
            flow_data = {
                "name": flow.name or "Unnamed Flow",
                "entry_condition_type": flow.entry_condition_type or "order_completed",
                "entry_condition": flow.entry_condition or "",
                "steps": steps_data
            }
    
    try:
        result = generate_campaign_details_ai(segment_description, segment_criteria, flow_data)
        return result
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        error_msg = str(e)
        print("=" * 50)
        print("ERROR GENERATING CAMPAIGN:")
        print(f"Error: {error_msg}")
        print(f"Segment ID: {request.segment_id}")
        print(f"Flow ID: {request.flow_id}")
        print(f"Segment Description: {segment_description[:100] if segment_description else 'N/A'}")
        print("=" * 50)
        print(f"Full Traceback:\n{error_details}")
        print("=" * 50)
        raise HTTPException(status_code=500, detail=f"Error generating campaign: {error_msg}")

@router.post("/chat")
def chat_assistant(request: ChatRequest):
    """Suggestive chat assistant - provides segment description and campaign details"""
    try:
        response = generate_suggestive_response(request.prompt, request.context)
        return response
    except ValueError as e:
        # API key missing or configuration error
        error_msg = str(e)
        print("=" * 50)
        print("AI SERVICE CONFIGURATION ERROR:")
        print(error_msg)
        print("=" * 50)
        raise HTTPException(
            status_code=500,
            detail=f"AI service configuration error: {error_msg}"
        )
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        error_msg = str(e)
        print("=" * 50)
        print("ERROR IN AI CHAT:")
        print(f"Error: {error_msg}")
        print("=" * 50)
        print(f"Full Traceback:\n{error_details}")
        print("=" * 50)
        raise HTTPException(
            status_code=500,
            detail=f"Error generating response: {error_msg}"
        )
