from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class FraudType(str, Enum):
    STORTING_BOCOR = "STORTING_BOCOR"
    PINJAMAN_FIKTIF = "PINJAMAN_FIKTIF"
    MANIPULASI_STATUS = "MANIPULASI_STATUS"
    GPS_INVALID = "GPS_INVALID"
    MARKUP_PINJAMAN = "MARKUP_PINJAMAN"

class FraudLog(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    collector_id: str
    type: FraudType
    description: str
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow) # Anti-backdate: always use server time

class CollectorRisk(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    collector_id: str
    collector_name: str
    score: float
    category: str # Aman, Perlu perhatian, Berisiko tinggi
    details: Dict[str, Any] = {}
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class TransactionRequest(BaseModel):
    collector_id: str
    nasabah_id: str
    nominal_input: float
    lat: float
    lon: float
    # Tanggal dari frontend akan diabaikan oleh sistem (Anti-backdate)
    client_date: Optional[str] = None 

class NasabahStatus(str, Enum):
    PB = "PB"
    L_II = "L II"
    L_I = "L I"
    CCM = "CCM"
    CM = "CM"
    ML = "ML"
