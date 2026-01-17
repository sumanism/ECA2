"""
AI Service Implementation following SOLID principles
- Single Responsibility: Each method has one clear purpose
- Dependency Inversion: Uses interfaces and dependency injection
- Open/Closed: Extensible through interfaces
"""
import json
from typing import Dict, Any, Optional
from backend.services.ai_client import AIClientFactory
from backend.services.prompt_loader import PromptLoader
from backend.services.ai_error_handler import AIErrorHandler


def get_ai_client():
    """Get AI client using factory (Dependency Inversion)"""
    return AIClientFactory.create_client()


def get_model() -> str:
    """Get model name"""
    return AIClientFactory.get_model()


def extract_json_from_text(text: str) -> str:
    """Extract JSON from text that might contain markdown or extra text"""
    text = text.strip()
    
    # Remove markdown code blocks if present
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            if "{" in part and "}" in part:
                text = part
                if text.startswith("json"):
                    text = text[4:]
                break
    
    # Find JSON object boundaries
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        text = text[start_idx:end_idx+1]
    
    return text.strip()


def handle_ai_error(e: Exception) -> Dict[str, Any]:
    """Handle AI API errors using error handler (Single Responsibility)"""
    return AIErrorHandler.handle_error(e)


def generate_segment_criteria(prompt: str) -> Dict[str, Any]:
    """Convert human language to segment criteria using prompt file (Single Responsibility)"""
    try:
        client = get_ai_client()
        
        # Load prompt using PromptLoader (Dependency Inversion)
        fallback_prompt = """You are an AI assistant for an e-commerce Customer Data Platform. 
Convert the user's natural language request into segment criteria.

Available fields:
- total_order_value (number): Total amount customer has spent
- order_count (number): Number of orders placed
- days_since_last_order (number): Days since last order
- last_order_date (date): Date of last order
- shipping_state (string): State code (e.g., "CA", "TX")
- shipping_country (string): Country code
- email (string): Email address
- marketing_opt_in (boolean): Email subscription status

Available operators:
- gt: greater than
- lt: less than
- gte: greater than or equal
- lte: less than or equal
- eq: equals
- contains: string contains

Return ONLY valid JSON in this format:
{
  "logical_operator": "AND" or "OR",
  "criteria": [
    {
      "field": "field_name",
      "operator": "operator",
      "value": value
    }
  ],
  "explanation": "Brief explanation of the segment"
}"""
        
        system_prompt = PromptLoader.load_prompt('segment_criteria_prompt.txt', fallback_prompt)

        response = client.chat.completions.create(
            model=get_model(),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"User request: {prompt}\n\nReturn only the JSON, no other text."}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        # Extract JSON from response
        text = response.choices[0].message.content.strip()
        json_text = extract_json_from_text(text)
        
        result = json.loads(json_text)
        return result
    except Exception as e:
        error_info = handle_ai_error(e)
        print(f"Error generating segment criteria: {e}")
        import traceback
        traceback.print_exc()
        return {
            "logical_operator": "AND",
            "criteria": [],
            "explanation": f"⚠️ {error_info['message']}",
            "error": error_info
        }


def generate_flow_content(segment_description: str, step_type: str, step_number: int) -> Dict[str, Any]:
    """Generate flow step content based on segment"""
    try:
        client = get_ai_client()
        
        prompt = f"""Generate email content for a marketing flow step.

Segment Description: {segment_description}
Step Type: {step_type}
Step Number: {step_number}

Based on the segment and marketing best practices, generate:
- A compelling subject line
- Email body content (2-3 paragraphs)
- Appropriate tone and messaging

Return JSON:
{{
  "subject": "Email subject line",
  "body_text": "Email body content",
  "tone": "friendly/professional/urgent/etc"
}}

Return only the JSON, no other text."""

        response = client.chat.completions.create(
            model=get_model(),
            messages=[
                {"role": "system", "content": "You are an expert email marketing copywriter."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.8
        )
        
        text = response.choices[0].message.content.strip()
        
        # Extract JSON
        json_text = extract_json_from_text(text)
        result = json.loads(json_text)
        
        # Ensure required fields exist
        if "subject" not in result:
            result["subject"] = "Special Offer for You!"
        if "body_text" not in result:
            result["body_text"] = "We have a special offer that we think you'll love!"
        
        return result
    except Exception as e:
        error_info = handle_ai_error(e)
        print(f"Error generating flow content: {e}")
        import traceback
        traceback.print_exc()
        return {
            "subject": "Special Offer for You!",
            "body_text": f"⚠️ {error_info['message']}",
            "tone": "friendly",
            "error": error_info
        }


def generate_flow_from_segment(segment_description: str, segment_criteria: Dict[str, Any]) -> Dict[str, Any]:
    """Generate complete flow based on segment conditions using prompt file"""
    try:
        client = get_ai_client()
        
        # Load prompt using PromptLoader (Dependency Inversion)
        fallback_prompt = """Generate a marketing flow based on a customer segment.
Return JSON with entry_condition_type, name, entry_condition, and steps array.
Each step should have step_type, step_order, and config."""
        
        system_prompt = PromptLoader.load_prompt('flow_generation_prompt.txt', fallback_prompt)
        
        user_prompt = f"""Segment Description: {segment_description}
Segment Criteria: {json.dumps(segment_criteria, indent=2)}

Generate a complete flow for this segment. Consider the segment characteristics when creating the flow steps and messaging."""

        response = client.chat.completions.create(
            model=get_model(),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"{user_prompt}\n\nReturn only the JSON, no other text."}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        text = response.choices[0].message.content.strip()
        json_text = extract_json_from_text(text)
        result = json.loads(json_text)
        
        # Ensure required fields exist
        if "steps" not in result:
            result["steps"] = []
        if "entry_condition_type" not in result:
            result["entry_condition_type"] = "order_completed"
        if "name" not in result:
            result["name"] = f"Flow for {segment_description}"
        
        return result
    except Exception as e:
        error_info = handle_ai_error(e)
        print(f"Error generating flow from segment: {e}")
        import traceback
        traceback.print_exc()
        return {
            "entry_condition_type": "order_completed",
            "name": f"Flow for {segment_description}",
            "entry_condition": f"⚠️ {error_info['message']}",
            "steps": [],
            "error": error_info
        }


def generate_campaign_details(segment_description: str, segment_criteria: Dict[str, Any], flow_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Generate complete campaign setup based on segment and flow using prompt file"""
    try:
        client = get_ai_client()
        
        # Load prompt using PromptLoader (Dependency Inversion)
        fallback_prompt = """You are an AI assistant for an e-commerce Customer Data Platform. 
Generate a complete marketing campaign setup based on a customer segment and optional flow.

Return ONLY valid JSON in this format:
{
  "name": "Campaign name that reflects the segment and purpose",
  "description": "Detailed description of the campaign strategy and goals",
  "start_time_of_day": "HH:MM (recommended send time, e.g., '10:00', '14:30')",
  "time_recommendation_reason": "Brief explanation of why this time is optimal",
  "marketing_strategy": "Brief explanation of the marketing approach",
  "recommendations": [
    "Recommendation 1 for campaign execution",
    "Recommendation 2 for campaign execution"
  ]
}

Campaign Generation Guidelines:
1. Campaign name should be descriptive and reflect the target segment and goal
2. Description should explain the campaign strategy, target audience, and expected outcomes
3. Start time should be during optimal email open hours (typically 9 AM - 2 PM)
4. Consider the segment characteristics when recommending timing
5. If a flow is provided, align campaign timing with flow entry conditions"""
        
        system_prompt = PromptLoader.load_prompt('campaign_generation_prompt.txt', fallback_prompt)
        
        # Safely serialize segment_criteria
        try:
            criteria_json = json.dumps(segment_criteria, indent=2, default=str)
        except Exception as e:
            print(f"Warning: Could not serialize segment_criteria: {e}")
            criteria_json = str(segment_criteria)
        
        user_prompt = f"""Segment Description: {segment_description}
Segment Criteria: {criteria_json}"""
        
        if flow_data:
            # Safely serialize flow steps (limit to first 3 to avoid token limits)
            try:
                steps_preview = flow_data.get('steps', [])[:3]
                # Clean up config for serialization
                clean_steps = []
                for step in steps_preview:
                    clean_step = {
                        "step_type": step.get("step_type", "SEND_EMAIL"),
                        "step_order": step.get("step_order", 1),
                    }
                    # Only include key config fields
                    config = step.get("config", {})
                    if isinstance(config, dict):
                        clean_step["config"] = {
                            k: v for k, v in config.items() 
                            if k in ["subject", "body_text", "duration_days", "title", "message"]
                        }
                    clean_steps.append(clean_step)
                
                steps_json = json.dumps(clean_steps, indent=2, default=str)
            except Exception as e:
                print(f"Warning: Could not serialize flow steps: {e}")
                steps_json = "Unable to serialize flow steps"
            
            user_prompt += f"""
Flow Information:
- Flow Name: {flow_data.get('name', 'N/A')}
- Entry Condition: {flow_data.get('entry_condition_type', 'N/A')}
- Number of Steps: {len(flow_data.get('steps', []))}
- Flow Steps (first 3): {steps_json}
"""
        
        user_prompt += "\nGenerate a complete campaign setup for this segment and flow combination."

        try:
            print("Calling AI API for campaign generation...")
            response = client.chat.completions.create(
                model=get_model(),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"{user_prompt}\n\nReturn only the JSON, no other text."}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            
            text = response.choices[0].message.content.strip()
            
            print(f"AI Response length: {len(text)} characters")
            print(f"AI Response preview: {text[:200]}...")
            
            if not text:
                raise ValueError("Empty response from AI model")
            
            json_text = extract_json_from_text(text)
            
            if not json_text:
                print(f"Could not extract JSON. Original text: {text[:500]}")
                raise ValueError("Could not extract JSON from AI response")
            
            print(f"Extracted JSON: {json_text[:200]}...")
            result = json.loads(json_text)
            print(f"Parsed JSON successfully. Keys: {list(result.keys())}")
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print(f"Extracted text: {json_text[:1000] if 'json_text' in locals() else 'N/A'}")
            raise ValueError(f"Invalid JSON response from AI: {e}")
        except Exception as e:
            error_info = handle_ai_error(e)
            print(f"Error calling AI model: {e}")
            import traceback
            traceback.print_exc()
            raise ValueError(f"⚠️ {error_info['message']}")
        
        # Ensure required fields exist with proper defaults
        # Note: start_date is NOT generated - user selects it manually
        
        if "name" not in result or not result.get("name"):
            result["name"] = f"Campaign for {segment_description}"
        if "description" not in result or not result.get("description"):
            result["description"] = f"Marketing campaign targeting {segment_description}"
        
        # Validate and format time (required - AI must provide this)
        if "start_time_of_day" not in result or not result.get("start_time_of_day"):
            result["start_time_of_day"] = "10:00"
            result["time_recommendation_reason"] = "Default morning time for general campaigns"
        else:
            # Validate time format (HH:MM)
            time_str = str(result["start_time_of_day"])
            if ':' in time_str and len(time_str.split(':')) == 2:
                try:
                    hours, minutes = time_str.split(':')
                    if 0 <= int(hours) <= 23 and 0 <= int(minutes) <= 59:
                        result["start_time_of_day"] = f"{int(hours):02d}:{int(minutes):02d}"
                    else:
                        result["start_time_of_day"] = "10:00"
                        result["time_recommendation_reason"] = "Default morning time (invalid time provided)"
                except:
                    result["start_time_of_day"] = "10:00"
                    result["time_recommendation_reason"] = "Default morning time (time parsing failed)"
            else:
                result["start_time_of_day"] = "10:00"
                result["time_recommendation_reason"] = "Default morning time (invalid format)"
        
        # Ensure time_recommendation_reason exists
        if "time_recommendation_reason" not in result:
            result["time_recommendation_reason"] = "Optimal time based on segment characteristics and marketing best practices"
        
        if "marketing_strategy" not in result:
            result["marketing_strategy"] = "Personalized messaging based on segment characteristics"
        if "recommendations" not in result or not isinstance(result.get("recommendations"), list):
            result["recommendations"] = ["Use personalized subject lines", "Include relevant product recommendations"]
        
        return result
    except ValueError as e:
        # This is raised from the inner try block for quota/API errors
        error_message = str(e)
        print(f"Error generating campaign details: {error_message}")
        return {
            "name": f"Campaign for {segment_description}",
            "description": error_message,
            "start_time_of_day": "10:00",
            "time_recommendation_reason": "Default time (API error occurred)",
            "marketing_strategy": "Unable to generate strategy due to API error",
            "recommendations": ["Please try again later or check your API quota"]
        }
    except Exception as e:
        error_info = handle_ai_error(e)
        print(f"Error generating campaign details: {e}")
        import traceback
        traceback.print_exc()
        return {
            "name": f"Campaign for {segment_description}",
            "description": f"⚠️ {error_info['message']}",
            "start_time_of_day": "10:00",
            "marketing_strategy": "Personalized messaging based on segment characteristics",
            "recommendations": ["Use personalized subject lines", "Include relevant product recommendations"]
        }


def generate_suggestive_response(prompt: str, context: Optional[str] = None) -> Dict[str, Any]:
    """Generate a suggestive response with segment description and campaign details"""
    try:
        client = get_ai_client()
        
        system_prompt = """You are a helpful AI assistant for an e-commerce Customer Data Platform. 
When users ask about creating segments and campaigns, provide a structured response.

Return ONLY valid JSON in this format:
{
  "segment_description": "A natural language description that can be used in the segment creation form (e.g., 'High-value customers with total order value above $1000 who are subscribed to email marketing and haven't ordered in the last 60 days')",
  "campaign": {
    "subject": "Email subject line for the campaign",
    "send_time": "Recommended send time (e.g., 'Tuesday 10 AM', 'Morning', 'Afternoon')",
    "send_date": "Recommended send date strategy (e.g., 'Within 3 days of segment creation', 'Next week', 'Immediate')",
    "content_ideas": [
      "Plain-text idea 1 for email content",
      "Plain-text idea 2 for email content",
      "Plain-text idea 3 for email content"
    ]
  },
  "explanation": "Brief explanation of the segment and campaign strategy"
}

The segment_description should be in natural language that can be directly pasted into the segment creation description field.
The campaign details should be marketing-focused and relevant to the segment."""

        user_prompt = prompt
        if context:
            user_prompt = f"Context: {context}\n\nUser question: {prompt}"

        response = client.chat.completions.create(
            model=get_model(),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"User request: {user_prompt}\n\nReturn only the JSON, no other text."}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        # Extract JSON from response
        text = response.choices[0].message.content.strip()
        json_text = extract_json_from_text(text)
        result = json.loads(json_text)
        
        # Ensure all required fields exist
        if "segment_description" not in result:
            result["segment_description"] = "Segment description based on your request"
        if "campaign" not in result:
            result["campaign"] = {
                "subject": "Special Offer for You!",
                "send_time": "Morning",
                "send_date": "Within 3 days",
                "content_ideas": ["We have a special offer for you!"]
            }
        if "explanation" not in result:
            result["explanation"] = "Generated based on your request"
        
        return result
    except Exception as e:
        error_info = handle_ai_error(e)
        print(f"Error generating suggestive response: {e}")
        import traceback
        traceback.print_exc()
        # Return fallback response
        return {
            "segment_description": f"⚠️ {error_info['message']}",
            "campaign": {
                "subject": "Special Offer for You!",
                "send_time": "Morning",
                "send_date": "Within 3 days",
                "content_ideas": ["We have a special offer that we think you'll love!"]
            },
            "explanation": f"⚠️ {error_info['message']}"
        }
