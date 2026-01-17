# AI Generation Workflows

## Overview
This document describes how AI is used to generate segments, flows, and campaigns.

## AI Generation Sequence

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AIAPI
    participant AIService
    participant PromptLoader
    participant AIClient
    participant OpenAI
    
    User->>Frontend: Request AI Generation
    Frontend->>AIAPI: POST /api/ai/{endpoint}
    
    alt Generate Segment Criteria
        AIAPI->>AIService: generate_segment_criteria(prompt)
        AIService->>PromptLoader: load_prompt('segment_criteria_prompt.txt')
        PromptLoader-->>AIService: System prompt
        AIService->>AIClient: get_ai_client()
        AIClient-->>AIService: OpenAI client
        AIService->>OpenAI: chat.completions.create()
        OpenAI-->>AIService: JSON response
        AIService->>AIService: extract_json_from_text()
        AIService->>AIService: validate criteria structure
        AIService-->>AIAPI: Criteria JSON
        AIAPI-->>Frontend: Segment criteria
        Frontend-->>User: Display criteria
    end
    
    alt Generate Flow from Segment
        AIAPI->>AIService: generate_flow_from_segment(segment_data)
        AIService->>PromptLoader: load_prompt('flow_generation_prompt.txt')
        AIService->>AIClient: get_ai_client()
        AIService->>OpenAI: Generate flow structure
        OpenAI-->>AIService: Flow JSON with steps
        AIService-->>AIAPI: Complete flow structure
        AIAPI-->>Frontend: Flow data
        Frontend-->>User: Display flow
    end
    
    alt Generate Campaign Details
        AIAPI->>AIService: generate_campaign_details(segment, flow)
        AIService->>PromptLoader: load_prompt('campaign_generation_prompt.txt')
        AIService->>AIClient: get_ai_client()
        AIService->>OpenAI: Generate campaign strategy
        OpenAI-->>AIService: Campaign JSON
        AIService-->>AIAPI: Campaign details
        AIAPI-->>Frontend: Campaign data
        Frontend-->>User: Display campaign
    end
```

## AI Chat Assistant Flow

```mermaid
sequenceDiagram
    participant User
    participant ChatUI
    participant AIAPI
    participant AIService
    participant OpenAI
    
    User->>ChatUI: Ask question about segments/campaigns
    ChatUI->>AIAPI: POST /api/ai/chat
    AIAPI->>AIService: generate_suggestive_response(prompt)
    AIService->>OpenAI: Generate structured response
    OpenAI-->>AIService: JSON with segment_description + campaign
    AIService-->>AIAPI: Structured response
    AIAPI-->>ChatUI: Response data
    
    alt User wants to create segment
        ChatUI->>ChatUI: Navigate to /segments
        ChatUI->>ChatUI: Pre-fill description
        ChatUI-->>User: Segment creation form
    end
    
    alt User wants to create campaign
        ChatUI->>ChatUI: Navigate to /campaigns
        ChatUI->>ChatUI: Pre-fill campaign details
        ChatUI-->>User: Campaign creation form
    end
```

## AI Error Handling

```mermaid
flowchart TD
    Start([AI API Call]) --> CallAPI[Call OpenAI API]
    CallAPI --> CheckResponse{Response OK?}
    
    CheckResponse -->|Success| ParseJSON[Parse JSON Response]
    CheckResponse -->|Error| CheckErrorType{Error Type?}
    
    CheckErrorType -->|Rate Limit 429| RateLimit[Handle Rate Limit]
    CheckErrorType -->|Auth Error 401/403| AuthError[Handle Auth Error]
    CheckErrorType -->|API Error| APIError[Handle API Error]
    CheckErrorType -->|Other| GenericError[Handle Generic Error]
    
    RateLimit --> ReturnError[Return User-Friendly Error]
    AuthError --> ReturnError
    APIError --> ReturnError
    GenericError --> ReturnError
    
    ParseJSON --> ValidateJSON{Valid JSON?}
    ValidateJSON -->|Yes| ExtractData[Extract Required Fields]
    ValidateJSON -->|No| Fallback[Use Fallback Response]
    
    ExtractData --> ValidateFields{Required Fields Present?}
    ValidateFields -->|Yes| ReturnSuccess[Return Generated Data]
    ValidateFields -->|No| FillDefaults[Fill Default Values]
    FillDefaults --> ReturnSuccess
    
    Fallback --> ReturnError
    ReturnSuccess --> End([End])
    ReturnError --> End
```

## Prompt File Structure

All AI prompts are stored in `backend/prompts/`:

```
prompts/
├── segment_criteria_prompt.txt    # Segment criteria generation
├── flow_generation_prompt.txt      # Flow generation
└── campaign_generation_prompt.txt # Campaign generation
```

### Benefits:
- ✅ Version-controlled with code
- ✅ Easy to edit without code changes
- ✅ Can be reviewed in PRs
- ✅ Supports multiple languages (future)

## AI Response Formats

### Segment Criteria Response
```json
{
  "logical_operator": "AND",
  "criteria": [
    {
      "field": "total_order_value",
      "operator": "gt",
      "value": 1000
    }
  ],
  "explanation": "High-value customers"
}
```

### Flow Generation Response
```json
{
  "entry_condition_type": "order_completed",
  "name": "Post-Purchase Flow",
  "steps": [
    {
      "step_type": "SEND_EMAIL",
      "step_order": 1,
      "config": {
        "subject": "Thank you!",
        "body_text": "..."
      }
    }
  ]
}
```

### Campaign Generation Response
```json
{
  "name": "VIP Customer Campaign",
  "description": "...",
  "start_time_of_day": "10:00",
  "time_recommendation_reason": "...",
  "marketing_strategy": "...",
  "recommendations": [...]
}
```
