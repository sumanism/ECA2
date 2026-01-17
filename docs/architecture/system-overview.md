# System Overview

## Architecture Layers

```mermaid
graph TB
    subgraph "Presentation Layer"
        A[React Frontend]
        B[UI Components]
        C[Pages]
    end
    
    subgraph "API Layer"
        D[FastAPI Application]
        E[API Routers]
        F[Request Validation]
    end
    
    subgraph "Business Logic Layer"
        G[Service Interfaces]
        H[AI Service]
        I[Segment Service]
        J[Campaign Service]
        K[Flow Service]
    end
    
    subgraph "Data Access Layer"
        L[SQLModel ORM]
        M[Database Models]
    end
    
    subgraph "Infrastructure Layer"
        N[SQLite Database]
        O[AI Client Factory]
        P[Prompt Loader]
        Q[Error Handler]
    end
    
    A --> D
    B --> A
    C --> A
    D --> E
    E --> F
    F --> G
    G --> H
    G --> I
    G --> J
    G --> K
    H --> O
    H --> P
    H --> Q
    I --> L
    J --> L
    K --> L
    L --> M
    M --> N
```

## Core Components

### 1. Frontend (React + TypeScript)
- **Pages**: Dashboard, Customers, Segments, Campaigns, Flows, Analytics, Orders, Inventory, AI Agent
- **Components**: Reusable UI components (Button, Input, Select, Modal, etc.)
- **State Management**: React hooks (useState, useEffect)
- **API Client**: Axios with base URL configuration

### 2. Backend (FastAPI)
- **Routers**: RESTful API endpoints
- **Services**: Business logic implementation
- **Models**: Database schema definitions
- **Database**: SQLite with SQLModel ORM

### 3. AI Integration
- **Service**: Generic AI service supporting multiple providers
- **Client Factory**: Creates OpenAI-compatible clients
- **Prompt Management**: External prompt files for maintainability
- **Error Handling**: Centralized error processing

## Data Flow

### Read Operations
```mermaid
sequenceDiagram
    Frontend->>API: GET Request
    API->>Service: Business Logic
    Service->>Database: Query
    Database-->>Service: Data
    Service-->>API: Processed Data
    API-->>Frontend: JSON Response
```

### Write Operations
```mermaid
sequenceDiagram
    Frontend->>API: POST/PUT Request
    API->>Service: Validate & Process
    Service->>Database: Insert/Update
    Database-->>Service: Confirmation
    Service-->>API: Result
    API-->>Frontend: Success Response
```

### AI Generation Flow
```mermaid
sequenceDiagram
    Frontend->>API: POST /api/ai/*
    API->>AIService: Generate Request
    AIService->>PromptLoader: Load Prompt
    AIService->>AIClient: Get Client
    AIClient->>OpenAI: API Call
    OpenAI-->>AIClient: Response
    AIClient-->>AIService: Parsed Data
    AIService->>AIService: Validate & Format
    AIService-->>API: Generated Data
    API-->>Frontend: JSON Response
```

## Key Design Patterns

1. **Repository Pattern**: Services abstract data access
2. **Factory Pattern**: AIClientFactory creates clients
3. **Strategy Pattern**: Different AI providers via interfaces
4. **Observer Pattern**: Campaign status changes trigger actions

## Scalability Considerations

### Current Limitations
- SQLite database (single-file, not ideal for high concurrency)
- In-memory segment evaluation (all users loaded)
- Synchronous AI API calls

### Future Enhancements
- PostgreSQL for production
- Background job queue for campaign execution
- Caching layer for segment results
- Async AI API calls
- Database indexes for performance
