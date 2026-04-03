# Koperasi PDL - Dokumentasi Sistem

Aplikasi ini dibangun menggunakan arsitektur PWA (Progressive Web App) offline-first untuk memastikan performa tinggi di HP spek rendah dan stabil di jaringan lemah.

## 1. Struktur Folder Project

### Frontend (React + Vite + Dexie)
```
/src
  /components     # Komponen UI Reusable (Layout, dll)
  /lib            # Core Logic & Database
    - db.ts       # Setup IndexedDB (Dexie) untuk Offline Mode
    - logic.ts    # Logika bisnis (Perhitungan Angsuran, Kategori, dll)
    - utils.ts    # Utility functions
  /pages          # Halaman Aplikasi
    - Dashboard.tsx      # Beranda & Ringkasan Storting
    - TransaksiList.tsx  # Daftar Nasabah & Kategori Auto
    - TransaksiForm.tsx  # Form Pencairan (Kamera KTP, Promise)
    - AngsuranDetail.tsx # Detail Angsuran (Auto Calculate)
    - PembayaranForm.tsx # Form Pembayaran (Kamera Bukti, GPS)
    - StortingPage.tsx   # Rekapitulasi Storting Harian
  App.tsx         # Router Setup
  main.tsx        # Entry Point
```

### Backend (FastAPI - Konsep)
```
/backend
  /app
    /api
      /endpoints  # Route API (auth, transactions, payments, storting)
    /core         # Config, Security (JWT)
    /models       # Pydantic Models (Schema)
    /services     # Business Logic
    /db           # MongoDB Connection
    main.py       # FastAPI Entry Point
```

## 2. Desain Database MongoDB (Schema)

### Collection: `users`
```json
{
  "_id": "ObjectId",
  "email": "kolektor1@koperasi.com",
  "password_hash": "string",
  "role": "kolektor",
  "name": "Budi Santoso",
  "area": "Area 1"
}
```

### Collection: `transactions` (Single Source of Truth)
```json
{
  "_id": "ObjectId",
  "kolektor_id": "ObjectId",
  "tanggal_pencairan": "2023-10-01",
  "nama_nasabah": "Siti Aminah",
  "alamat": "Jl. Merdeka No. 10",
  "tanggal_lunas": "2023-10-31",
  "jumlah_hari": 30,
  "permohonan_pinjaman": 1000000,
  "target_masuk": 0,
  "target_keluar": 0,
  "acc_pinjaman": 1000000,
  "paraf_acc": "SPV_01",
  "foto_pencairan_url": "https://storage.../pencairan.jpg",
  "foto_promise_url": "https://storage.../promise.jpg",
  "foto_ktp_url": "https://storage.../ktp.jpg",
  "lokasi": {
    "type": "Point",
    "coordinates": [106.827153, -6.175392]
  },
  "created_at": "ISODate"
}
```

### Collection: `payments`
```json
{
  "_id": "ObjectId",
  "transaction_id": "ObjectId",
  "kolektor_id": "ObjectId",
  "tanggal_pembayaran": "ISODate",
  "nominal": 40000,
  "foto_bukti_url": "https://storage.../bukti.jpg",
  "lokasi": {
    "type": "Point",
    "coordinates": [106.827153, -6.175392]
  },
  "created_at": "ISODate"
}
```

### Collection: `storting_daily`
```json
{
  "_id": "ObjectId",
  "kolektor_id": "ObjectId",
  "date": "2023-10-01",
  "target_lalu": 5000000,
  "target_kini": 1000000,
  "target_berjalan": 6000000,
  "storting_lalu": 4500000,
  "storting_kini": 900000,
  "storting_berjalan": 5400000,
  "drop_lalu": 10000000,
  "drop_kini": 1000000,
  "drop_berjalan": 11000000,
  "persentase": 90.0,
  "paraf_acc": "SPV_01"
}
```

## 3. API Endpoint Lengkap (FastAPI)

- `POST /api/auth/login`: Login & get JWT Token
- `GET /api/transactions`: Get list of transactions for the logged-in kolektor
- `POST /api/transactions`: Create new transaction (Pencairan)
- `GET /api/transactions/{id}`: Get transaction details
- `POST /api/payments`: Submit new payment
- `GET /api/storting/daily`: Get today's storting data
- `POST /api/storting/target`: Set today's target
- `POST /api/sync`: Endpoint khusus untuk sinkronisasi data offline dari IndexedDB ke MongoDB.

## 4. Logika Perhitungan Angsuran & Storting

Logika ini diimplementasikan di `src/lib/logic.ts` untuk memastikan aplikasi tetap berjalan saat offline.

**A. Angsuran:**
- `saldo_awal` = `acc_pinjaman` * 1.2 (120%)
- `angsuran_harian` = `saldo_awal` / `jumlah_hari`
- `angsuran_tengah_bulan` = `angsuran_harian` * (hari berjalan sampai tgl 15, geser jika minggu)
- `saldo_tengah_bulan` = `saldo_awal` - `angsuran_tengah_bulan`

**B. Kategori Nasabah (Auto):**
Dihitung berdasarkan persentase tunggakan (`angsuran_tengah_bulan` - `total_dibayar`):
- 0% = PB (Pembayaran Baik)
- < 20% = L I (Lancar I)
- < 50% = L II (Lancar II)
- < 75% = CCM (Cukup Catatan Macet)
- < 100% = CM (Catatan Macet)
- >= 100% = ML (Macet Lancar/Total)

**C. Storting:**
- `target_berjalan` = `target_lalu` + `target_kini`
- `storting_berjalan` = `storting_lalu` + `storting_kini`
- `drop_berjalan` = `drop_lalu` + `drop_kini`
- `persentase` = (`storting_kini` / `target_kini`) * 100

## 5. Instruksi Menjalankan Aplikasi

Aplikasi ini berjalan di lingkungan Node.js dengan Vite.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Jalankan server development:
   ```bash
   npm run dev
   ```
3. Buka aplikasi di browser (disarankan menggunakan mode mobile/responsive design mode di DevTools).
4. Aplikasi menggunakan IndexedDB (Dexie) sehingga data akan tersimpan di browser Anda meskipun di-refresh.
5. Untuk mencoba fitur kamera, pastikan Anda memberikan izin akses kamera pada browser.
6. Untuk mencoba fitur GPS, pastikan Anda memberikan izin akses lokasi pada browser.
