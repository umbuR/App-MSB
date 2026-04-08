from fastapi import APIRouter, HTTPException, Depends
from typing import List
from .database import fraud_logs_collection, collector_risk_collection
from .services import FraudDetectionService

router = APIRouter(prefix="/fraud", tags=["Fraud Detection"])

@router.get("/summary")
async def get_fraud_summary():
    """Dashboard: Ringkasan Fraud"""
    total_alerts = await fraud_logs_collection.count_documents({})
    high_risk_collectors = await collector_risk_collection.count_documents({"category": "Berisiko tinggi"})
    
    return {
        "total_alerts": total_alerts,
        "high_risk_collectors": high_risk_collectors,
        "status": "active"
    }

@router.get("/alerts")
async def get_fraud_alerts(limit: int = 50):
    """Dashboard: Daftar Anomali Terbaru"""
    cursor = fraud_logs_collection.find().sort("created_at", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs

@router.get("/collector-risk")
async def get_collector_risk():
    """Dashboard: Kolektor Paling Berisiko"""
    cursor = collector_risk_collection.find().sort("score", -1)
    risks = await cursor.to_list(length=100)
    for risk in risks:
        risk["_id"] = str(risk["_id"])
    return risks

@router.post("/test-storting-leak")
async def test_storting_leak(collector_id: str, tagihan: float, pembayaran: float):
    """Endpoint untuk testing deteksi storting bocor"""
    await FraudDetectionService.check_storting_bocor(collector_id, tagihan, pembayaran)
    return {"message": "Pengecekan selesai. Cek /fraud/alerts jika selisih > 5%"}
