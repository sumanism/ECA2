import os
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment or use default
# Database will be created in the project root directory (one level up from backend)
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
database_path = os.path.join(base_dir, "database.db")
database_url = os.getenv("DATABASE_URL", f"sqlite:///{database_path}")

connect_args = {"check_same_thread": False} if "sqlite" in database_url else {}
engine = create_engine(database_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
