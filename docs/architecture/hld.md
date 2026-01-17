# High-Level Design (HLD)

## System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React Frontend]
        Pages[Dashboard/Customers/Segments/Campaigns/Flows]
    end
    
    subgraph "API Layer"
        FastAPI[FastAPI Application]
        Routers[API Routers]
        Middleware[CORS Middleware]
    end
    
    subgraph "Service Layer"
        AIService[AI Service]
        SegmentService[Segment Service]
        CampaignService[Campaign Service]
        FlowService[Flow Service]
    end
    
    subgraph "Data Layer"
        SQLite[(SQLite Database)]
        Models[SQLModel ORM]
    end
    
    subgraph "External Services"
        OpenAI[OpenAI API]
        EmailProvider[Email Service]
    end
    
    UI --> FastAPI
    Pages --> Routers
    Routers --> SegmentService
    Routers --> CampaignService
    Routers --> FlowService
    Routers --> AIService
    SegmentService --> Models
    CampaignService --> Models
    FlowService --> Models
    AIService --> OpenAI
    CampaignService --> EmailProvider
    Models --> SQLite
```

## Component Architecture

```mermaid
graph LR
    subgraph "Backend Components"
        A[Main App]
        B[Users Router]
        C[Segments Router]
        D[Campaigns Router]
        E[Flows Router]
        F[AI Assistant Router]
        G[Metrics Router]
    end
    
    subgraph "Services"
        H[AI Service]
        I[Campaign Executor]
        J[Segment Evaluator]
    end
    
    subgraph "Infrastructure"
        K[Database]
        L[AI Client Factory]
        M[Prompt Loader]
        N[Error Handler]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    
    C --> J
    D --> I
    F --> H
    
    H --> L
    H --> M
    H --> N
    
    I --> K
    J --> K
```

## Technology Stack

### Backend
- **Framework**: FastAPI 0.115+
- **ORM**: SQLModel (SQLAlchemy + Pydantic)
- **Database**: SQLite
- **AI Integration**: OpenAI SDK (configurable for multiple providers)
- **Environment**: Python 3.8+

### Frontend
- **Framework**: React 19.2.0 with TypeScript 5.9.3
- **Build Tool**: Vite 7.2.4
- **Styling**: Tailwind CSS 3.4.1
- **Routing**: React Router 7.12.0
- **HTTP Client**: Axios 1.13.2

## Core Modules

### 1. User Management
- Customer CRUD operations
- Customer metrics calculation
- Marketing preferences management

### 2. Segmentation Engine
- Dynamic segment creation
- Criteria evaluation (AND/OR logic)
- Real-time segment counting
- Relative date calculations

### 3. Campaign Management
- Campaign lifecycle (draft → active → paused → completed)
- Segment targeting
- Flow association
- Scheduling (date + time)

### 4. Flow Orchestration
- Multi-step email sequences
- Entry condition triggers
- Step types: SEND_EMAIL, WAIT, SEND_PUSH, EXIT
- Ordered step execution

### 5. AI Service
- Segment criteria generation
- Flow content generation
- Campaign strategy generation
- Chat assistant (suggestive)

## Data Model Relationships

```mermaid
erDiagram
    User ||--o{ Order : has
    User ||--o{ CustomerMetrics : has
    Segment ||--o{ Campaign : targets
    Segment ||--|| Flow : has
    Campaign }o--|| Flow : uses
    Flow ||--o{ FlowStep : contains
    Campaign ||--o{ CampaignStep : contains
    Order ||--o{ OrderItem : contains
    OrderItem }o--|| Product : references
    Product ||--o{ ProductSalesMetrics : has
    User ||--o{ CustomerProductAffinity : has
```

## Security & Configuration

- Environment-based configuration (`.env` files)
- API key management (no hardcoded keys)
- CORS configuration for frontend
- Input validation via Pydantic models
