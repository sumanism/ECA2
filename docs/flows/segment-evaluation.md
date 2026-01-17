# Segment Evaluation Flow

## Overview
This document describes how customer segments are evaluated against the user database.

## Segment Evaluation Process

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant SegmentAPI
    participant SegmentService
    participant Database
    participant Evaluator
    
    User->>Frontend: View Segment / Create Campaign
    Frontend->>SegmentAPI: GET /api/segments/{id}/count
    SegmentAPI->>SegmentService: get_segment_count()
    SegmentService->>Database: Fetch all users
    Database-->>SegmentService: Users list
    SegmentService->>Evaluator: evaluate_segment(segment, users)
    
    loop For each user
        Evaluator->>Evaluator: Evaluate each criterion
        Evaluator->>Evaluator: Apply logical operator (AND/OR)
    end
    
    Evaluator-->>SegmentService: Matching users count
    SegmentService-->>SegmentAPI: Count response
    SegmentAPI-->>Frontend: User count
    Frontend-->>User: Display count
```

## Criteria Evaluation Logic

```mermaid
flowchart TD
    Start([Start Evaluation]) --> LoadSegment[Load Segment Definition]
    LoadSegment --> GetUsers[Get All Users from Database]
    GetUsers --> ForEachUser{For Each User}
    
    ForEachUser --> GetCriteria[Get Criteria List]
    GetCriteria --> GetOperator[Get Logical Operator AND/OR]
    GetOperator --> ForEachCriterion{For Each Criterion}
    
    ForEachCriterion --> GetField[Get Field Name]
    GetField --> GetValue[Get User Field Value]
    GetValue --> CheckType{Field Type?}
    
    CheckType -->|Numeric| NumericOp[Apply: gt, lt, gte, lte, eq]
    CheckType -->|String| StringOp[Apply: eq, contains]
    CheckType -->|Date| DateOp[Calculate Relative Date]
    CheckType -->|Boolean| BoolOp[Apply: eq]
    
    NumericOp --> StoreResult[Store Criterion Result]
    StringOp --> StoreResult
    DateOp --> StoreResult
    BoolOp --> StoreResult
    
    StoreResult --> MoreCriteria{More Criteria?}
    MoreCriteria -->|Yes| ForEachCriterion
    MoreCriteria -->|No| ApplyOperator{Apply Logical Operator}
    
    ApplyOperator -->|AND| AllTrue{All Criteria True?}
    ApplyOperator -->|OR| AnyTrue{Any Criteria True?}
    
    AllTrue -->|Yes| AddUser[Add User to Matches]
    AllTrue -->|No| SkipUser[Skip User]
    AnyTrue -->|Yes| AddUser
    AnyTrue -->|No| SkipUser
    
    AddUser --> MoreUsers{More Users?}
    SkipUser --> MoreUsers
    MoreUsers -->|Yes| ForEachUser
    MoreUsers -->|No| ReturnResults[Return Matching Users]
    ReturnResults --> End([End])
```

## Criteria Operators

### Numeric Fields
- `gt`: Greater than
- `lt`: Less than
- `gte`: Greater than or equal
- `lte`: Less than or equal
- `eq`: Equal

### String Fields
- `eq`: Exact match (case-insensitive)
- `contains`: Substring match (case-insensitive)

### Date Fields
- `gt`: After date
- `lt`: Before date
- `eq`: On date
- Supports relative dates: `relative_7`, `relative_30`, `relative_60`, `relative_90`

### Boolean Fields
- `eq`: True/False match

## Logical Operators

### AND (Default)
All criteria must be true for a user to match.

**Example:**
```json
{
  "logical_operator": "AND",
  "criteria": [
    {"field": "total_order_value", "operator": "gt", "value": 1000},
    {"field": "marketing_opt_in", "operator": "eq", "value": true}
  ]
}
```
**Result**: Users with order value > $1000 AND marketing opt-in = true

### OR
At least one criterion must be true.

**Example:**
```json
{
  "logical_operator": "OR",
  "criteria": [
    {"field": "shipping_state", "operator": "eq", "value": "CA"},
    {"field": "shipping_state", "operator": "eq", "value": "NY"}
  ]
}
```
**Result**: Users in California OR New York

## Relative Date Calculations

For `last_order_date` field with relative dates:

```mermaid
sequenceDiagram
    participant Evaluator
    participant DateTime
    participant User
    
    Evaluator->>DateTime: Get current date/time
    Evaluator->>User: Get last_order_date
    User-->>Evaluator: last_order_date (or null)
    
    alt User has last_order_date
        Evaluator->>Evaluator: Calculate days_ago = now - last_order_date
        Evaluator->>Evaluator: Compare with relative_X value
    else User has no last_order_date
        Evaluator->>Evaluator: Treat as very old (999999 days)
    end
    
    Evaluator-->>Evaluator: Return match result
```

## Performance Considerations

- **Real-time Evaluation**: Currently evaluates all users in memory
- **Future Optimization**: 
  - Database indexes on frequently queried fields
  - Caching segment results
  - Background job for large segments
