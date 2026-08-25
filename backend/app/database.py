from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mystyla.db")

#using sqlite for now instead of postgres (0 setup for now. if we have time we chagnge it for the mid defense)


engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit = False, autoflush = False, bind = engine)
Base = declarative_base()


def ensure_database_schema():
    """Apply tiny compatibility migrations for existing local/dev databases."""
    inspector = inspect(engine)
    if not inspector.has_table("garment_classifications"):
        return

    columns = {column["name"] for column in inspector.get_columns("garment_classifications")}
    if "style_family" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE garment_classifications "
                    "ADD COLUMN style_family VARCHAR DEFAULT 'western'"
                )
            )
            connection.execute(
                text(
                    "UPDATE garment_classifications "
                    "SET style_family = 'western' "
                    "WHERE style_family IS NULL"
                )
            )

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
