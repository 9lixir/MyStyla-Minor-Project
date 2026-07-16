from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os
from dotenv import load_dotenv

load_dotenv()

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
default_db_path = os.path.join(backend_dir, "mystyla.db")
default_database_url = f"sqlite:///{default_db_path.replace('\\', '/')}"

DATABASE_URL = os.getenv("DATABASE_URL", default_database_url)

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
