"""
db.py — Database configuration and connection setup using SQLAlchemy.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# Target Database File: backend/data/quant.db
DB_PATH = settings.DATA_DIR / "quant.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Ensure target data directory exists
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """
    SQLite-specific pragmas:
    1. WAL (Write-Ahead Logging) for safe concurrent reads/writes.
    2. Enforce foreign keys.
    """
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency generator yielding database sessions.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
