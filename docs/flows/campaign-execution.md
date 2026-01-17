# Campaign Execution Flow

## Overview
This document describes the complete flow of campaign execution from creation to email delivery.

## Campaign Execution Sequence

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant CampaignAPI
    participant CampaignService
    participant SegmentService
    participant FlowEngine
    participant Scheduler
    participant EmailProvider
    
    User->>Frontend: Create Campaign
    Frontend->>CampaignAPI: POST /api/campaigns
    CampaignAPI->>CampaignService: create_campaign()
    CampaignService->>CampaignService: Validate segment & flow
    CampaignService->>CampaignService: Store campaign (status: draft)
    CampaignService-->>CampaignAPI: Campaign created
    CampaignAPI-->>Frontend: Campaign response
    Frontend-->>User: Campaign created
    
    User->>Frontend: Activate Campaign
    Frontend->>CampaignAPI: PUT /api/campaigns/{id}/status (active)
    CampaignAPI->>CampaignService: update_status(active)
    CampaignService->>SegmentService: evaluate_segment()
    SegmentService->>SegmentService: Apply criteria (AND/OR)
    SegmentService-->>CampaignService: Matching users list
    CampaignService->>FlowEngine: Get flow steps (if flow_id exists)
    FlowEngine-->>CampaignService: Flow steps with config
    CampaignService->>Scheduler: Schedule campaign execution
    Scheduler->>Scheduler: Calculate send times (start_date + start_time_of_day)
    Scheduler->>EmailProvider: Queue emails for delivery
    EmailProvider-->>Scheduler: Emails queued
    Scheduler-->>CampaignService: Execution scheduled
    CampaignService-->>CampaignAPI: Campaign activated
    CampaignAPI-->>Frontend: Status updated
    Frontend-->>User: Campaign active
```

## Campaign Lifecycle States

```mermaid
stateDiagram-v2
    [*] --> draft: Create Campaign
    draft --> active: Activate
    draft --> draft: Update
    active --> paused: Pause
    active --> completed: Complete (after execution)
    paused --> active: Resume
    paused --> completed: Complete
    completed --> [*]
    
    note right of draft
        Campaign being prepared
        Can edit all fields
    end note
    
    note right of active
        Campaign running
        Emails being sent
    end note
    
    note right of paused
        Temporarily stopped
        Can resume or complete
    end note
```

## Campaign Execution Steps

### 1. Campaign Creation
- User selects segment
- Optionally selects flow
- Sets campaign name, description
- Chooses start date (manual)
- AI suggests optimal time (optional)

### 2. Campaign Activation
- Status changes: `draft` → `active`
- Segment evaluation runs
- Flow steps retrieved (if flow associated)
- Emails scheduled based on:
  - Campaign `start_date`
  - Campaign `start_time_of_day`
  - Flow step delays (if flow used)

### 3. Email Delivery
- Scheduler triggers at scheduled time
- For each target user:
  - Check marketing opt-in
  - Send email with personalized content
  - Track delivery status

### 4. Campaign Completion
- All emails sent
- Status changes: `active` → `completed`
- Analytics updated

## Flow Integration

When a campaign uses a flow:

```mermaid
sequenceDiagram
    participant Campaign
    participant Flow
    participant FlowStep1
    participant FlowStep2
    participant FlowStep3
    participant Scheduler
    
    Campaign->>Flow: Get flow steps
    Flow->>FlowStep1: Step 1 (SEND_EMAIL)
    Flow->>FlowStep2: Step 2 (WAIT 3 days)
    Flow->>FlowStep3: Step 3 (SEND_EMAIL)
    
    Campaign->>Scheduler: Schedule Step 1 (start_date + start_time)
    Campaign->>Scheduler: Schedule Step 2 (Step 1 time + 3 days)
    Campaign->>Scheduler: Schedule Step 3 (Step 2 time + 0 days)
    
    Note over Scheduler: All steps scheduled with delays
```

## Error Handling

- **Segment not found**: Campaign creation fails
- **Flow not found**: Campaign created without flow
- **No matching users**: Campaign activated but no emails sent
- **Email delivery failure**: Retry logic (future enhancement)
