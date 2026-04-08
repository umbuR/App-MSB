from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .routers import router as fraud_router
from .sync_router import router as sync_router
import time

app = FastAPI(title="Koperasi Anti-Fraud API")

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware: Anti Backdate & Logging
@app.middleware("http")
async def anti_backdate_middleware(request: Request, call_next):
    # Sistem secara otomatis mengabaikan timestamp dari client
    # dan selalu menggunakan server time di level model/database (datetime.utcnow)
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Server-Time"] = str(time.time()) # Bukti server time
    return response

app.include_router(fraud_router)
app.include_router(sync_router)

@app.get("/")
async def root():
    return {"message": "Koperasi Backend API with Anti-Fraud System is running"}
