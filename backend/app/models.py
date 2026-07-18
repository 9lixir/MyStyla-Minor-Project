from sqlalchemy import Column, String, JSON, DateTime
from datetime import datetime
import uuid

from app.database import Base


class Garment(Base):
    __tablename__ = "garments"

<<<<<<< HEAD
    id = Column(String, primary_key = True, default = lambda: str(uuid.uuid4()))
    filename = Column(String, nullable = False)
    original_path = Column(String, nullable = False)
    cutout_path = Column(String, nullable = False)
    dominant_colors = Column(JSON, nullable = False)
    qdrant_id = Column(String, nullable = True)
    created_at = Column(DateTime, default = datetime.now)

class TagCorrection(Base):
    __tablename__ = "tag_corrections"
    id = Column(String, primary_key=True)
    garment_id = Column(String)
    field = Column(String)          
    predicted_value = Column(String)
    corrected_value = Column(String)
    created_at = Column(DateTime, default=datetime.now)
=======
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    original_path = Column(String, nullable=False)
    cutout_path = Column(String, nullable=False)
    dominant_colors = Column(JSON, nullable=False)
    qdrant_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)


class GarmentClassification(Base):
    __tablename__ = "garment_classifications"

    garment_id = Column(String, primary_key=True)
    user_id = Column(String, nullable=True, index=True)
    category = Column(String, nullable=False)
    formality = Column(String, nullable=False)
    season = Column(String, nullable=False)
    pattern = Column(String, nullable=False)
    occasion = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
>>>>>>> main
