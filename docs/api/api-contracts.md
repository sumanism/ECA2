# API Contracts

## Base URL
```
http://localhost:8000/api
```

## Authentication
Currently no authentication required (development mode).

## Common Response Formats

### Success Response
```json
{
  "id": "uuid",
  "field1": "value1",
  ...
}
```

### Error Response
```json
{
  "detail": "Error message"
}
```

## Endpoints

### Users

#### GET /users
Get all users with optional filtering.

**Query Parameters:**
- `skip`: int (default: 0)
- `limit`: int (default: 100)
- `search`: string (optional, searches name/email)

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "total_order_value": 1500.0,
    "order_count": 5,
    ...
  }
]
```

#### POST /users
Create a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "marketing_opt_in": true,
  "shipping_state": "CA",
  "shipping_country": "US"
}
```

#### PUT /users/{user_id}
Update a user.

#### DELETE /users/{user_id}
Delete a user.

### Segments

#### GET /segments
Get all segments.

#### POST /segments
Create a segment.

**Request Body:**
```json
{
  "name": "High-Value Customers",
  "description": "Customers with order value > $1000",
  "definition": {
    "logical_operator": "AND",
    "criteria": [
      {
        "field": "total_order_value",
        "operator": "gt",
        "value": 1000
      }
    ]
  }
}
```

#### GET /segments/{segment_id}/count
Get count of users matching segment.

**Response:**
```json
{
  "segment_id": "uuid",
  "count": 42
}
```

#### GET /segments/{segment_id}/users
Get list of matching users.

**Query Parameters:**
- `limit`: int (default: 100)

**Response:**
```json
{
  "segment_id": "uuid",
  "users": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "total_order_value": 1500.0
    }
  ],
  "columns": ["first_name", "last_name", "email", "total_order_value"]
}
```

#### POST /segments/{segment_id}/evaluate
Evaluate segment against all users.

### Campaigns

#### GET /campaigns
Get all campaigns.

#### POST /campaigns
Create a campaign.

**Request Body:**
```json
{
  "name": "VIP Campaign",
  "description": "Campaign for VIP customers",
  "segment_id": "uuid",
  "flow_id": "uuid",  // optional
  "status": "draft",
  "start_date": "2024-01-15T00:00:00",
  "start_time_of_day": "10:00"
}
```

#### PUT /campaigns/{campaign_id}/status
Update campaign status.

**Request Body:**
```json
{
  "status": "active"  // draft | active | paused | completed
}
```

### Flows

#### GET /flows
Get all flows.

#### POST /flows
Create a flow with steps.

**Request Body:**
```json
{
  "name": "Welcome Flow",
  "segment_id": "uuid",
  "entry_condition_type": "signup",
  "steps": [
    {
      "step_type": "SEND_EMAIL",
      "step_order": 1,
      "config": {
        "subject": "Welcome!",
        "body_text": "Thank you for signing up..."
      }
    },
    {
      "step_type": "WAIT",
      "step_order": 2,
      "config": {
        "duration_days": 3
      }
    }
  ]
}
```

### AI Assistant

#### POST /ai/segments/build
Generate segment criteria from description.

**Request Body:**
```json
{
  "prompt": "High-value customers in Texas"
}
```

**Response:**
```json
{
  "logical_operator": "AND",
  "criteria": [...],
  "explanation": "..."
}
```

#### POST /ai/flows/generate-from-segment
Generate complete flow from segment.

**Request Body:**
```json
{
  "segment_id": "uuid",
  "segment_description": "High-value customers"
}
```

#### POST /ai/campaigns/generate
Generate campaign details.

**Request Body:**
```json
{
  "segment_id": "uuid",
  "flow_id": "uuid",  // optional
  "segment_description": "High-value customers"
}
```

#### POST /ai/chat
Chat assistant for suggestions.

**Request Body:**
```json
{
  "prompt": "I want to target inactive customers",
  "context": "optional context"
}
```

### Metrics

#### GET /metrics/dashboard
Get dashboard metrics.

**Response:**
```json
{
  "total_revenue": 150000.0,
  "total_customers": 1000,
  "total_orders": 5000,
  "average_order_value": 30.0,
  "conversion_rate": 2.5,
  "customer_segments": 8,
  "active_campaigns": 3
}
```
