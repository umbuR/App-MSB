from motor.motor_asyncio import AsyncIOMotorClient
import os

# Konfigurasi MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.koperasi_db

# Collections
fraud_logs_collection = db.get_collection("fraud_logs")
collector_risk_collection = db.get_collection("collector_risk")
transactions_collection = db.get_collection("transactions")
nasabah_collection = db.get_collection("nasabah")
