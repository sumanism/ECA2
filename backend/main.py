from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from .env file
# Try to load from backend/.env first, then project root .env
backend_dir = os.path.dirname(os.path.abspath(__file__))
backend_env = os.path.join(backend_dir, ".env")
root_env = os.path.join(os.path.dirname(backend_dir), ".env")

# Load .env from backend directory first, then project root
if os.path.exists(backend_env):
    load_dotenv(backend_env)
    print(f"✓ Loaded .env from: {backend_env}")
elif os.path.exists(root_env):
    load_dotenv(root_env)
    print(f"✓ Loaded .env from: {root_env}")
else:
    # Try default behavior (current directory)
    load_dotenv()
    print("⚠ No .env file found. Using environment variables only.")

from backend.database import create_db_and_tables
from backend.routers import users, segments, campaigns, flows, metrics, ai_assistant

app = FastAPI(title="E-commerce CDP Assistant API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(segments.router, prefix="/api/segments", tags=["segments"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["campaigns"])
app.include_router(flows.router, prefix="/api/flows", tags=["flows"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(ai_assistant.router, prefix="/api/ai", tags=["ai-assistant"])

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {"message": "E-commerce CDP Assistant API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
