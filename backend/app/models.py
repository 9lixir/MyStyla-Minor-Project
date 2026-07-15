from sqlalchemy import Column, String, JSON, DateTime
from datetime import datetime
import uuid

from app.database import Base


class Garment(Base):
    __tablename__ = "garments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    original_path = Column(String, nullable=False)
    cutout_path = Column(String, nullable=False)
    dominant_colors = Column(JSON, nullable=False)
    qdrant_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)