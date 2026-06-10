"""
memory_engine.py — Persistent Memory Layer for the Adaptive Intelligence System
Reimplemented using SQLAlchemy ORM for database integration.
Maintains a RAM cache of recent predictions for fast read access.
"""
import logging
import threading
import json
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any

from config import settings
from database.db import Base, engine, SessionLocal
from database.models import (
    PredictionMemory,
    PredictionOutcome,
    SetupStats,
    AdaptiveWeight,
    WeightHistory,
)
import database.crud as db_crud

logger = logging.getLogger(__name__)

# ── Default adaptive weights ──────────────────────────────────────────────────
DEFAULT_WEIGHTS: Dict[str, float] = {
    "TA_WEIGHT":           0.70,
    "NEWS_WEIGHT":         0.30,
    "RSI_MULTIPLIER":      1.00,
    "MACD_MULTIPLIER":     1.00,
    "EMA_MULTIPLIER":      1.00,
    "MOMENTUM_MULTIPLIER": 1.00,
    "BB_MULTIPLIER":       1.00,
}

# Weight bounds — we never allow weights to drift beyond these limits
WEIGHT_BOUNDS: Dict[str, tuple] = {
    "TA_WEIGHT":           (0.55, 0.85),
    "NEWS_WEIGHT":         (0.15, 0.45),
    "RSI_MULTIPLIER":      (0.50, 1.50),
    "MACD_MULTIPLIER":     (0.50, 1.50),
    "EMA_MULTIPLIER":      (0.50, 1.50),
    "MOMENTUM_MULTIPLIER": (0.50, 1.50),
    "BB_MULTIPLIER":       (0.50, 1.50),
}


class MemoryEngine:
    """
    Thread-safe SQLAlchemy wrapper with an in-memory prediction cache.
    All DB operations are protected by a single re-entrant lock for cache consistency.
    """

    def __init__(self, ram_cache_size: int = 200):
        self._lock = threading.RLock()
        self._ram_cache: deque = deque(maxlen=ram_cache_size)  # most recent predictions
        self._weights_cache: Dict[str, float] = {}             # key → current value

        self._init_db()
        self._seed_default_weights()
        self._reload_weights_cache()
        logger.info("[MemoryEngine] Initialized database and loaded weight caches.")

    # ── Schema initialization ─────────────────────────────────────────────────

    def _init_db(self):
        with self._lock:
            Base.metadata.create_all(bind=engine)
            logger.info("[MemoryEngine] Schema verified/created.")

    def _seed_default_weights(self):
        """Insert default weights only if the table is empty for GLOBAL."""
        with self._lock:
            with SessionLocal() as session:
                for key, val in DEFAULT_WEIGHTS.items():
                    exists = session.query(AdaptiveWeight).filter_by(
                        weight_key=key, symbol="GLOBAL"
                    ).first()
                    if not exists:
                        db_weight = AdaptiveWeight(
                            weight_key=key,
                            symbol="GLOBAL",
                            value=val,
                            default_value=val,
                            last_updated=datetime.now(timezone.utc),
                        )
                        session.add(db_weight)
                session.commit()

    def _reload_weights_cache(self):
        with self._lock:
            with SessionLocal() as session:
                rows = session.query(AdaptiveWeight).filter_by(symbol="GLOBAL").all()
                self._weights_cache = {r.weight_key: r.value for r in rows}

    # ── Prediction storage ────────────────────────────────────────────────────

    def store_prediction(self, snapshot: dict) -> int:
        """
        Persist a prediction snapshot. Returns the new row id.
        snapshot must include all required columns.
        """
        with self._lock:
            with SessionLocal() as session:
                db_pred = db_crud.create_prediction(session, snapshot)
                cached_item = self._model_to_dict(db_pred)
                self._ram_cache.append(cached_item)
                return db_pred.id

    def get_predictions(self, symbol: str, limit: int = 20) -> List[dict]:
        """Return the most recent N predictions for a symbol."""
        with self._lock:
            # Try RAM cache first
            cached = [p for p in reversed(self._ram_cache) if p.get("symbol") == symbol]
            if len(cached) >= limit:
                return cached[:limit]

            # Fallback to DB
            with SessionLocal() as session:
                rows = db_crud.get_predictions(session, symbol, limit)
                return [self._model_to_dict(r) for r in rows]

    def get_pending_evaluations(self, horizon_seconds: int) -> List[dict]:
        """
        Return predictions that:
        - were made >= horizon_seconds ago
        - do NOT yet have an outcomes row for this horizon label
        """
        horizon_label = self._seconds_to_label(horizon_seconds)
        cutoff = datetime.now(timezone.utc).timestamp() - horizon_seconds
        cutoff_dt = datetime.fromtimestamp(cutoff, tz=timezone.utc)
        
        with SessionLocal() as session:
            rows = db_crud.get_pending_evaluations(session, cutoff_dt, horizon_label)
            return [self._model_to_dict(r) for r in rows]

    @staticmethod
    def _seconds_to_label(seconds: int) -> str:
        mapping = {900: "15m", 3600: "1h", 14400: "4h"}
        return mapping.get(seconds, f"{seconds}s")

    # ── Outcome storage ───────────────────────────────────────────────────────

    def store_outcome(self, outcome: dict) -> None:
        with self._lock:
            with SessionLocal() as session:
                # Ensure evaluated_at is parsed
                db_crud.create_outcome(session, outcome)

    def get_outcomes(self, symbol: str, limit: int = 50) -> List[dict]:
        with SessionLocal() as session:
            rows = db_crud.get_outcomes(session, symbol, limit)
            return [self._outcome_to_dict(r) for r in rows]

    # ── Setup stats ───────────────────────────────────────────────────────────

    def upsert_setup_stats(self, stats: dict) -> None:
        with self._lock:
            with SessionLocal() as session:
                db_crud.upsert_setup_stats(session, stats)

    def get_setup_stats(self, symbol: str = "GLOBAL") -> List[dict]:
        with SessionLocal() as session:
            rows = db_crud.get_setup_stats(session, symbol)
            return [self._setup_to_dict(r) for r in rows]

    def get_outcomes_for_setup(self, setup_name: str, symbol: str) -> List[dict]:
        """Fetch all evaluated outcomes for predictions that had a specific setup tag."""
        with SessionLocal() as session:
            rows = session.query(
                PredictionOutcome.price_change.label("price_change_pct"),
                PredictionOutcome.outcome
            ).join(
                PredictionMemory, PredictionMemory.id == PredictionOutcome.prediction_id
            ).filter(
                PredictionMemory.symbol == symbol,
                PredictionMemory.active_setups.like(f'%"{setup_name}"%'),
                PredictionOutcome.horizon == '1h'
            ).all()
            return [{"price_change_pct": r.price_change_pct, "outcome": r.outcome} for r in rows]

    def get_raw_outcomes_for_symbol(self, symbol: str, horizon: str = "1h") -> List[dict]:
        """Return all evaluated outcomes joined with their prediction's setup list."""
        with SessionLocal() as session:
            return db_crud.get_raw_outcomes_for_symbol(session, symbol, horizon)

    # ── Adaptive weights ──────────────────────────────────────────────────────

    def get_weight(self, key: str, symbol: str = "GLOBAL") -> float:
        """Fast read from RAM cache; fallback to DB if not cached."""
        if symbol == "GLOBAL" and key in self._weights_cache:
            return self._weights_cache[key]
        with self._lock:
            with SessionLocal() as session:
                val = db_crud.get_weight(session, key, symbol)
                return val if val is not None else DEFAULT_WEIGHTS.get(key, 1.0)

    def set_weight(self, key: str, new_value: float, reason: str, symbol: str = "GLOBAL") -> None:
        lo, hi = WEIGHT_BOUNDS.get(key, (0.1, 2.0))
        new_value = max(lo, min(hi, new_value))
        old_value = self.get_weight(key, symbol)
        now = datetime.now(timezone.utc)
        
        with self._lock:
            with SessionLocal() as session:
                db_crud.set_weight(session, key, new_value, DEFAULT_WEIGHTS.get(key, 1.0), symbol)
                db_crud.record_weight_history(session, {
                    "weight_key": key,
                    "symbol": symbol,
                    "old_value": old_value,
                    "new_value": new_value,
                    "reason": reason,
                    "changed_at": now
                })
            # Update RAM cache
            if symbol == "GLOBAL":
                self._weights_cache[key] = new_value
        logger.info(f"[MemoryEngine] Weight '{key}' updated: {old_value:.3f} → {new_value:.3f} ({reason})")

    def get_all_weights(self) -> List[dict]:
        with SessionLocal() as session:
            rows = db_crud.get_all_weights(session)
            return [self._weight_to_dict(r) for r in rows]

    def get_weight_history(self, limit: int = 20) -> List[dict]:
        with SessionLocal() as session:
            rows = db_crud.get_weight_history(session, limit)
            return [self._weight_history_to_dict(r) for r in rows]

    # ── Utilities ─────────────────────────────────────────────────────────────

    @staticmethod
    def _model_to_dict(model: PredictionMemory) -> dict:
        """Convert PredictionMemory ORM model to backward-compatible dict."""
        if not model:
            return {}
        d = {
            "id": model.id,
            "symbol": model.symbol,
            "timeframe": model.timeframe,
            "bias": model.prediction,  # Map prediction -> bias
            "prediction": model.prediction,
            "confidence_score": model.confidence,  # Map confidence -> confidence_score
            "confidence": model.confidence,
            "technical_score": model.technical_score,
            "news_score": model.sentiment_score,  # Map sentiment_score -> news_score
            "sentiment_score": model.sentiment_score,
            "market_regime": model.market_regime,
            "rsi_value": model.rsi_value,
            "macd_signal": model.macd_signal,
            "ema_trend": model.ema_trend,
            "momentum_signal": model.momentum_signal,
            "bb_signal": model.bb_signal,
            "atr_pct": model.atr_pct,
            "price_at_prediction": model.price_at_prediction,
        }
        
        # Format timestamp as ISO format string
        if isinstance(model.created_at, datetime):
            d["timestamp"] = model.created_at.isoformat()
        else:
            d["timestamp"] = str(model.created_at)

        # Deserialize active_setups JSON
        if model.active_setups:
            try:
                d["active_setups"] = json.loads(model.active_setups)
            except Exception:
                d["active_setups"] = []
        else:
            d["active_setups"] = []
            
        return d

    @staticmethod
    def _outcome_to_dict(model: PredictionOutcome) -> dict:
        """Convert PredictionOutcome ORM model to dict."""
        if not model:
            return {}
        return {
            "id": model.id,
            "prediction_id": model.prediction_id,
            "horizon": model.horizon,
            "price_at_outcome": model.price_at_outcome,
            "price_change_pct": model.price_change,  # Map price_change -> price_change_pct
            "outcome": model.outcome,
            "success": model.success,
            "actual_direction": model.actual_direction,
            "evaluated_at": model.evaluated_at.isoformat() if isinstance(model.evaluated_at, datetime) else str(model.evaluated_at),
        }

    @staticmethod
    def _setup_to_dict(s: SetupStats) -> dict:
        return {
            "setup_name": s.setup_name,
            "symbol": s.symbol,
            "total_predictions": s.total_predictions,
            "correct_count": s.correct_count,
            "incorrect_count": s.incorrect_count,
            "neutral_count": s.neutral_count,
            "win_rate": s.win_rate,
            "avg_return_pct": s.avg_return_pct,
            "last_updated": s.last_updated.isoformat() if s.last_updated else None
        }

    @staticmethod
    def _weight_to_dict(w: AdaptiveWeight) -> dict:
        return {
            "weight_key": w.weight_key,
            "symbol": w.symbol,
            "value": w.value,
            "default_value": w.default_value,
            "last_updated": w.last_updated.isoformat() if w.last_updated else None
        }

    @staticmethod
    def _weight_history_to_dict(h: WeightHistory) -> dict:
        return {
            "id": h.id,
            "weight_key": h.weight_key,
            "symbol": h.symbol,
            "old_value": h.old_value,
            "new_value": h.new_value,
            "reason": h.reason,
            "changed_at": h.changed_at.isoformat() if h.changed_at else None
        }

    def count_predictions(self, symbol: str) -> int:
        with SessionLocal() as session:
            return db_crud.count_predictions(session, symbol)


# Module-level singleton
memory_engine = MemoryEngine()
