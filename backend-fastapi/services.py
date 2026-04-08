from datetime import datetime, timedelta
from geopy.distance import geodesic
from .models import FraudLog, FraudType, CollectorRisk, NasabahStatus
from .database import fraud_logs_collection, collector_risk_collection, transactions_collection, nasabah_collection

class FraudDetectionService:
    
    @staticmethod
    async def log_fraud(collector_id: str, fraud_type: FraudType, description: str, metadata: dict = {}):
        """Menyimpan log fraud ke MongoDB dan memicu update risk score"""
        log = FraudLog(
            collector_id=collector_id,
            type=fraud_type,
            description=description,
            metadata=metadata
        )
        await fraud_logs_collection.insert_one(log.model_dump(by_alias=True, exclude={"id"}))
        await FraudDetectionService.update_collector_risk(collector_id)

    @staticmethod
    async def check_storting_bocor(collector_id: str, total_tagihan: float, total_pembayaran: float):
        """1. DETEKSI STORTING BOCOR"""
        if total_tagihan == 0:
            return
        
        selisih = total_tagihan - total_pembayaran
        persentase_selisih = (selisih / total_tagihan) * 100

        if persentase_selisih > 5:
            await FraudDetectionService.log_fraud(
                collector_id,
                FraudType.STORTING_BOCOR,
                f"Indikasi penahanan setoran. Selisih: {persentase_selisih:.2f}%",
                {"total_tagihan": total_tagihan, "total_pembayaran": total_pembayaran, "selisih": selisih}
            )

    @staticmethod
    async def check_pinjaman_fiktif(nasabah_data: dict, lat: float, lon: float):
        """2. DETEKSI PINJAMAN FIKTIF"""
        # Cek KTP Duplikat
        existing_ktp = await nasabah_collection.find_one({"ktp": nasabah_data["ktp"]})
        if existing_ktp:
            raise ValueError("KTP sudah terdaftar. Indikasi duplikasi data.")

        # Cek GPS Radius 50m
        nearby_nasabah = await nasabah_collection.find().to_list(1000)
        for n in nearby_nasabah:
            if "lat" in n and "lon" in n:
                dist = geodesic((lat, lon), (n["lat"], n["lon"])).meters
                if dist < 50:
                    await FraudDetectionService.log_fraud(
                        nasabah_data["collector_id"],
                        FraudType.PINJAMAN_FIKTIF,
                        f"Radius GPS terlalu dekat ({dist:.2f}m) dengan nasabah {n['nama']}",
                        {"jarak_meter": dist, "nasabah_terdekat": n["_id"]}
                    )
                    break

    @staticmethod
    async def validate_gps_transaction(collector_id: str, nasabah_lat: float, nasabah_lon: float, trx_lat: float, trx_lon: float):
        """5. VALIDASI GPS TRANSAKSI"""
        dist = geodesic((nasabah_lat, nasabah_lon), (trx_lat, trx_lon)).meters
        if dist > 200:
            await FraudDetectionService.log_fraud(
                collector_id,
                FraudType.GPS_INVALID,
                f"Lokasi transaksi tidak valid. Jarak: {dist:.2f} meter dari rumah nasabah.",
                {"jarak_meter": dist}
            )
            raise ValueError("Lokasi transaksi berada di luar radius yang diizinkan (>200m).")

    @staticmethod
    async def check_markup_pinjaman(collector_id: str, nominal_acc: float, nominal_input: float):
        """6. DETEKSI MARKUP PINJAMAN"""
        if nominal_acc != nominal_input:
            await FraudDetectionService.log_fraud(
                collector_id,
                FraudType.MARKUP_PINJAMAN,
                f"Markup terdeteksi. ACC: {nominal_acc}, Input: {nominal_input}",
                {"acc": nominal_acc, "input": nominal_input}
            )
            raise ValueError("Nominal input tidak sesuai dengan nominal ACC sistem.")

    @staticmethod
    def calculate_auto_status(hari_terlambat: int) -> str:
        """3. DETEKSI MANIPULASI STATUS NASABAH (FULL AUTO)"""
        if hari_terlambat == 0: return NasabahStatus.PB
        elif hari_terlambat <= 3: return NasabahStatus.L_II
        elif hari_terlambat <= 7: return NasabahStatus.L_I
        elif hari_terlambat <= 14: return NasabahStatus.CCM
        elif hari_terlambat <= 30: return NasabahStatus.CM
        else: return NasabahStatus.ML

    @staticmethod
    async def update_collector_risk(collector_id: str):
        """🧠 RISK SCORING KOLEKTOR"""
        logs = await fraud_logs_collection.find({"collector_id": collector_id}).to_list(1000)
        
        storting_bocor_count = sum(1 for l in logs if l["type"] == FraudType.STORTING_BOCOR)
        gps_invalid_count = sum(1 for l in logs if l["type"] == FraudType.GPS_INVALID)
        fiktif_count = sum(1 for l in logs if l["type"] == FraudType.PINJAMAN_FIKTIF)
        
        # Hitung skor (0-100)
        score = 0
        score += min(storting_bocor_count * 15, 40) # Max 40
        score += min(gps_invalid_count * 10, 30)    # Max 30
        score += min(fiktif_count * 20, 30)         # Max 30
        
        score = min(score, 100)
        
        category = "Aman"
        if score > 60:
            category = "Berisiko tinggi"
        elif score > 30:
            category = "Perlu perhatian"
            
        risk_data = {
            "collector_id": collector_id,
            "collector_name": f"Kolektor {collector_id}", # Idealnya join dengan table users
            "score": score,
            "category": category,
            "details": {
                "storting_bocor": storting_bocor_count,
                "gps_invalid": gps_invalid_count,
                "fiktif": fiktif_count
            },
            "last_updated": datetime.utcnow()
        }
        
        await collector_risk_collection.update_one(
            {"collector_id": collector_id},
            {"$set": risk_data},
            upsert=True
        )
