import os
from contextlib import contextmanager
from typing import Generator, Iterator, Optional
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

# Import models so SQLModel metadata knows all tables before create_all. 
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable must be set")

_engine: Optional[Engine] = None


def get_engine() -> Engine:
    """Return a singleton SQLAlchemy engine based on DATABASE_URL."""
    global _engine
    if _engine is None:
        #connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("postgresql") else {}
        _engine = create_engine(url=DATABASE_URL,echo=False)
    return _engine


def create_db_and_tables() -> None:
    """Create database tables from SQLModel metadata."""
    #SQLModel.metadata.create_all()
    SQLModel.metadata.create_all(get_engine())


def ping_database() -> bool:
    """Run a lightweight query to confirm database connectivity."""
    try:
        with Session(get_engine()) as session:
            session.execute(text("SELECT 1")).scalar_one()
        return True
    except Exception:
        return False


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a DB session per request."""
    with Session(get_engine()) as session:
        yield session


@contextmanager
def session_scope() -> Iterator[Session]:
    """Context manager for scripts/services that need explicit session handling."""
    session = Session(get_engine())
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
