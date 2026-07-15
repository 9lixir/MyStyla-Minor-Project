from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mystyla.db")

# using sqlite for now instead of postgres (0 setup for now. if we have time we change it for the mid defense)

is_sqlite = DATABASE_URL.startswith("sqlite")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if is_sqlite else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """
    Single shared declarative base for the whole app.
    IMPORTANT: every model file (models.py, outfit_models.py, etc.) must import Base from HERE, not redefine its own.
    """
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()