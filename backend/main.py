from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.router import api_router
from app.core.config import settings
from app.db.session import SessionLocal

# ── Rate Limiter ────────────────────────────────
# Using slowapi for IP-based rate limiting on auth routes
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60/minute"],  # Global sane default
)

app = FastAPI(
    title="Second Commit API",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS Middleware ──────────────────────────────
# Parse comma-separated origins from CORS_ORIGINS env var
origins = [
    origin.strip()
    for origin in settings.CORS_ORIGINS.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting middleware (after CORS, so CORS headers are set first)
app.add_middleware(SlowAPIMiddleware)

# ── Health Check ─────────────────────────────────


@app.get("/health")
def health_check():
    """Lightweight health check for system monitoring."""
    db_status = "connected"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
    }


# ── API Router ───────────────────────────────────

app.include_router(api_router, prefix="/api")
