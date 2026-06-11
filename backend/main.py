"""
main.py — Application entry point.

Initialises the FastAPI app, registers all routers, and starts background
tasks on startup.  All route-level logic lives in the routers/ package.

Entry point (unchanged for Render / local dev):
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""
import asyncio
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure stdout uses UTF-8 on Windows (avoids UnicodeEncodeError with box chars)
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass  # Python < 3.7

from config import settings

# ── Database Initialization & Table Creation ──────────────────────────────────
# This must run before importing any routers to ensure database tables exist
# prior to module-level instantiations in router imports.
from database.db import Base, engine
import database.models  # Ensure models are registered to Base.metadata
try:
    Base.metadata.create_all(bind=engine)
    print("[Database] Schema check: SQLite tables verified/created at startup.")
    
    # ── SQLite Database Migration for Users table ──
    from sqlalchemy import text
    with engine.connect() as conn:
        existing_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
        mutated = False
        if "subscription_plan" not in existing_cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN subscription_plan VARCHAR DEFAULT 'free' NOT NULL"))
            print("[Database Migration] Added column 'subscription_plan' to users table.")
            mutated = True
        if "subscription_status" not in existing_cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN subscription_status VARCHAR DEFAULT 'inactive' NOT NULL"))
            print("[Database Migration] Added column 'subscription_status' to users table.")
            mutated = True
        if "telegram_access" not in existing_cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN telegram_access BOOLEAN DEFAULT 0 NOT NULL"))
            print("[Database Migration] Added column 'telegram_access' to users table.")
            mutated = True
        if "telegram_chat_id" not in existing_cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN telegram_chat_id VARCHAR NULL"))
            print("[Database Migration] Added column 'telegram_chat_id' to users table.")
            mutated = True
        if mutated:
            conn.commit()
except Exception as e:
    print(f"[Database] ERROR: Failed to check or migrate SQLite tables at startup: {e}")

# ── Router imports ─────────────────────────────────────────────────────────────
from routers.market        import router as market_router
from routers.signals       import router as signals_router
from routers.sentiment     import router as sentiment_router
from routers.technical     import router as technical_router
from routers.telegram      import router as telegram_router
from routers.backtesting   import router as backtesting_router
from routers.paper_trading import router as paper_trading_router
from routers.websockets    import router as websockets_router
from routers.mobile_routes import router as mobile_router
from routers.quant_routes  import router as quant_router
from routers.auth          import router as auth_router

# ── App initialisation ─────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description="Real-time Indian Options Market Signal Dashboard with Technical and Sentiment Analysis",
    version="1.0.0",
)

# ── Global Exception Handlers for Debugging ────────────────────────────────────
import logging
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException as FastAPIHTTPException

logger = logging.getLogger("main")

@app.exception_handler(FastAPIHTTPException)
async def http_exception_handler(request: Request, exc: FastAPIHTTPException):
    logger.error(f"HTTPException in request {request.method} {request.url.path}: status_code={exc.status_code}, detail={exc.detail}")
    if exc.status_code >= 500:
        logger.exception(exc)
        traceback.print_exc()
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception in request: {request.method} {request.url.path}")
    logger.exception(exc)
    traceback.print_exc()
    return JSONResponse(
        status_code=503,
        content={"detail": f"Service Temporarily Unavailable: {str(exc)}", "type": type(exc).__name__}
    )

# ── CORS middleware ────────────────────────────────────────────────────────────
cors_origins = [settings.FRONTEND_URL] if hasattr(settings, "FRONTEND_URL") else ["http://localhost:5173", "http://localhost:3000"]
if getattr(settings, "ALLOW_MOBILE_CORS", True) or settings.DEBUG:
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request logging middleware ────────────────────────────────────────────────
import time
from starlette.middleware.base import BaseHTTPMiddleware

class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        t0 = time.monotonic()
        response = await call_next(request)
        ms = (time.monotonic() - t0) * 1000
        # Only log /api/* and /health — ignore websockets noise
        path = request.url.path
        if path.startswith("/api") or path == "/health":
            print(f"[REQ] {request.method} {path} -> {response.status_code}  ({ms:.0f}ms)")
        return response

app.add_middleware(RequestLogMiddleware)

# ── Register routers ───────────────────────────────────────────────────────────
app.include_router(market_router)
app.include_router(signals_router)
app.include_router(sentiment_router)
app.include_router(technical_router)
app.include_router(telegram_router)
app.include_router(backtesting_router)
app.include_router(paper_trading_router)
app.include_router(websockets_router)
app.include_router(quant_router)
app.include_router(auth_router, prefix="/api/auth")

if getattr(settings, "MOBILE_APP_API_ENABLED", True):
    app.include_router(mobile_router, prefix="/api/mobile")

# ── System Endpoints ───────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health_check():
    """Health check endpoint for deployment monitoring."""
    return {"status": "ok"}


# ── Startup background tasks ───────────────────────────────────────────────────
@app.on_event("startup")
async def _startup():
    # ── Database Initialization & Startup Checks ──────────────────────────────
    from database.db import Base, engine, SessionLocal
    from database.models import NewsArticle, PredictionMemory, PredictionOutcome, MarketSnapshot, TelegramSubscriber, SentNews, User
    try:
        Base.metadata.create_all(bind=engine)
        print("[Database] Schema check: SQLite tables verified/created.")
        with SessionLocal() as db:
            news_count = db.query(NewsArticle).count()
            preds_count = db.query(PredictionMemory).count()
            outcomes_count = db.query(PredictionOutcome).count()
            snaps_count = db.query(MarketSnapshot).count()
            subs_count = db.query(TelegramSubscriber).count()
            sent_count = db.query(SentNews).count()
        print(f"[Database] Status - News: {news_count}, Predictions: {preds_count}, Outcomes: {outcomes_count}, Snapshots: {snaps_count}, Subscribers: {subs_count}, SentNews: {sent_count}")
        print("[Database] Health check passed. SQLite single source of truth is active.")
    except Exception as e:
        print(f"[Database] ERROR: Startup database checks failed: {e}")

    from market_stream import stream_manager
    asyncio.create_task(stream_manager.run_stream())
    asyncio.create_task(_paper_trade_auto_close_loop())

    # ── Adaptive Intelligence System ────────────────────────────────────────────
    from core.outcome_tracker import outcome_tracker
    outcome_tracker.start()
    print("[AdaptiveAI] Outcome tracker background task started (evaluates every 5 min).")

    if settings.TELEGRAM_ENABLED:
        from news_alert_service import news_alert_service
        from telegram_notifier import poll_commands
        asyncio.create_task(news_alert_service.run_news_alert_loop())
        asyncio.create_task(poll_commands())
        print("[Telegram] News alert background task started.")
        print("[Telegram] Command listener background task started.")
    else:
        print("[Telegram] Notifications disabled (TELEGRAM_ENABLED=false).")

    # ── Print all registered routes (useful for debugging 404s on Render) ──────
    from fastapi.routing import APIRoute
    print("\n[Routes] --- Registered API routes ---")
    for route in app.routes:
        if isinstance(route, APIRoute):
            methods = ",".join(sorted(route.methods or []))
            print(f"  [{methods}] {route.path}")
    print("[Routes] --- End of route list ---\n")



async def _paper_trade_auto_close_loop():
    """Background loop: auto-close paper trades when SL / Target is hit."""
    from paper_trade import paper_engine
    while True:
        try:
            await paper_engine.update_positions()
        except Exception as e:
            print(f"Error in paper trade auto-close loop: {e}")
        await asyncio.sleep(3)  # check every 3 seconds


# ── Local development entry point ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
