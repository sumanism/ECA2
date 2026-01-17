# E-commerce Customer Data Platform (CDP) Assistant

A comprehensive Customer Data Platform (CDP) with AI-powered campaign generation for e-commerce businesses. This platform enables businesses to manage customer data, create targeted segments, build multi-step marketing campaigns, and leverage AI to generate campaign strategies through natural language prompts.

## 📋 Features

- **Dashboard**: Real-time metrics and insights
- **Customer Management**: CRUD operations with search and filtering
- **Orders Management**: Track and manage customer orders
- **Inventory Management**: Monitor stock levels and predictions
- **Analytics**: View detailed business analytics
- **Segmentation**: Create dynamic customer segments
- **Campaigns**: Design and execute multi-step marketing campaigns
- **Flows**: Create multi-step email sequences with delays
- **AI Assistant**: Generate campaigns using natural language

## 🛠️ Tech Stack

### Backend
- **Python** 3.8+
- **FastAPI** - Web framework
- **SQLModel** - ORM and database models
- **SQLite** - Database
- **OpenAI** (optional) - AI integration

### Frontend
- **React** 19.2.0
- **TypeScript** 5.9.3
- **Vite** 7.2.4
- **Tailwind CSS** 4.1.18
- **React Router** 7.12.0
- **Axios** 1.13.2
- **Lucide React** - Icon library

## 📁 Project Structure

```
ECA2/
├── backend/
│   ├── routers/          # API route handlers
│   │   ├── users.py
│   │   ├── segments.py
│   │   ├── campaigns.py
│   │   ├── flows.py
│   │   ├── ai_assistant.py
│   │   └── metrics.py
│   ├── services/         # Business logic (SOLID principles)
│   │   ├── interfaces.py      # Service interfaces
│   │   ├── ai_service.py      # AI service implementation
│   │   ├── ai_client.py       # AI client factory
│   │   ├── prompt_loader.py   # Prompt file loader
│   │   ├── ai_error_handler.py # Error handling
│   │   ├── campaign_executor.py
│   │   └── logging.py
│   ├── models.py         # Database models
│   ├── database.py       # Database configuration
│   ├── main.py           # FastAPI application
│   └── requirements.txt  # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── Layout.tsx
│   │   │   └── AiAssistant.tsx
│   │   ├── pages/        # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Customers.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── Inventory.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── Segments.tsx
│   │   │   ├── Flows.tsx
│   │   │   ├── Campaigns.tsx
│   │   │   └── Agent.tsx
│   │   ├── App.tsx       # Root component
│   │   ├── main.tsx      # React entry point
│   │   ├── api.ts        # API client
│   │   └── index.css     # Global styles
│   ├── package.json      # Node dependencies
│   └── vite.config.ts    # Vite configuration
│
├── database.db           # SQLite database (generated)
├── .gitignore
└── README.md
```

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- **[High-Level Design (HLD)](./docs/architecture/hld.md)** - System architecture with Mermaid diagrams
- **[Architecture Decision Records (ADRs)](./docs/adr/)** - Key design decisions and rationale
- **[API Documentation](./docs/api/api-contracts.md)** - Complete API reference
- **[Flow Documentation](./docs/flows/)** - Business process flows and sequence diagrams
- **[Environment Setup](./backend/ENV_SETUP.md)** - AI service configuration guide

### Quick Links
- [System Overview](./docs/architecture/system-overview.md)
- [Campaign Execution Flow](./docs/flows/campaign-execution.md)
- [Segment Evaluation Flow](./docs/flows/segment-evaluation.md)
- [AI Generation Workflows](./docs/flows/ai-generation.md)

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- On Windows:
```bash
venv\Scripts\activate
```
- On macOS/Linux:
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file in the backend directory:
```env
# REQUIRED: AI API Key (OpenAI SDK standard variable name)
OPENAI_API_KEY=your-api-key-here

# OPTIONAL: Provider configuration (defaults shown)
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
OPENAI_MODEL=gemini-2.5-flash
```

**Note**: 
- The API key is **required**. The application will raise an error if it's missing.
- Uses OpenAI SDK standard environment variable names (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`)
- Fallback support for `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` for backward compatibility
- See `backend/ENV_SETUP.md` for detailed configuration options and examples.

6. Run the backend server:
```bash
# If running from the backend directory:
uvicorn main:app --reload --port 8000

# Or if running from the project root:
uvicorn backend.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
API documentation (Swagger UI) will be available at `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📚 API Endpoints

### Users
- `GET /api/users/` - List all users
- `GET /api/users/{user_id}` - Get user by ID
- `POST /api/users/` - Create new user
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Delete user

### Segments
- `GET /api/segments/` - List all segments
- `GET /api/segments/{segment_id}` - Get segment by ID
- `POST /api/segments/` - Create new segment
- `PUT /api/segments/{segment_id}` - Update segment
- `DELETE /api/segments/{segment_id}` - Delete segment
- `POST /api/segments/{segment_id}/evaluate` - Evaluate segment

### Campaigns
- `GET /api/campaigns/` - List all campaigns
- `GET /api/campaigns/{campaign_id}` - Get campaign by ID
- `POST /api/campaigns/` - Create new campaign
- `PUT /api/campaigns/{campaign_id}` - Update campaign
- `DELETE /api/campaigns/{campaign_id}` - Delete campaign

### Flows
- `GET /api/flows/` - List all flows
- `GET /api/flows/{flow_id}` - Get flow by ID
- `POST /api/flows/` - Create new flow
- `PUT /api/flows/{flow_id}` - Update flow
- `DELETE /api/flows/{flow_id}` - Delete flow

### AI Agent
- `POST /api/agent/generate` - Generate campaign from prompt
- `GET /api/agent/logs` - Get AI generation logs

### Metrics
- `GET /api/metrics/dashboard` - Get dashboard metrics
- `GET /api/metrics/customers/{user_id}/metrics` - Get customer metrics
- `GET /api/metrics/products/{product_id}/metrics` - Get product metrics
- `GET /api/metrics/top-products` - Get top selling products

## 🎨 UI Design

The application features a modern dark-themed UI inspired by leading e-commerce platforms:
- Dark color scheme with blue accents
- Responsive card-based layouts
- Interactive tables with sorting and filtering
- AI Assistant sidebar for campaign generation
- Real-time metrics and insights

## 🤖 AI Assistant

The AI Assistant uses OpenAI's GPT-4o-mini model (with fallback to mock responses) to:
- Generate segment criteria from natural language
- Create campaign suggestions
- Provide explanations for generated strategies

Example prompts:
- "Find high-value customers with LTV over $500"
- "Target customers in Texas who haven't ordered recently"
- "Create a segment for customers who bought electronics"

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
