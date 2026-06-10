"""
crud.py — CRUD helpers for SQLAlchemy options signals models.
"""
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import json
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.models import (
    NewsArticle,
    PredictionMemory,
    PredictionOutcome,
    MarketSnapshot,
    SetupStats,
    AdaptiveWeight,
    WeightHistory,
    TelegramSubscriber,
    SentNews,
)

# ── 1. News Articles ─────────────────────────────────────────────────────────

def get_news_articles(db: Session, category: Optional[str] = None, limit: int = 100) -> List[NewsArticle]:
    query = db.query(NewsArticle)
    if category:
        query = query.filter(NewsArticle.category == category)
    return query.order_by(NewsArticle.published.desc()).limit(limit).all()

def create_news_articles_batch(db: Session, articles: List[Dict[str, Any]]) -> int:
    added = 0
    for art in articles:
        # Check uniqueness by URL or (headline, source, published)
        exists = db.query(NewsArticle).filter(NewsArticle.url == art["url"]).first()
        if exists:
            continue
        
        # If url is unique, also check (headline, source, published) to be extra safe
        exists_by_fields = db.query(NewsArticle).filter(
            NewsArticle.headline == art["headline"],
            NewsArticle.source == art["source"],
            NewsArticle.published == art["published"]
        ).first()
        if exists_by_fields:
            continue

        db_item = NewsArticle(
            headline=art["headline"],
            summary=art.get("summary"),
            source=art["source"],
            url=art["url"],
            published=art["published"],
            sentiment=art["sentiment"],
            impact_score=art["impact_score"],
            first_seen_at=art.get("first_seen_at", datetime.now(timezone.utc)),
            category=art["category"],
            related_symbols=",".join(art.get("related_symbols", [])) if isinstance(art.get("related_symbols"), list) else art.get("related_symbols"),
        )
        db.add(db_item)
        added += 1
    if added > 0:
        db.commit()
    return added

def delete_news_by_category(db: Session, category: str) -> bool:
    try:
        db.query(NewsArticle).filter(NewsArticle.category == category).delete()
        db.commit()
        return True
    except Exception:
        db.rollback()
        return False

def get_news_by_date(db: Session, date_str: str) -> List[NewsArticle]:
    """date_str in YYYY-MM-DD format"""
    return db.query(NewsArticle).filter(
        func.strftime("%Y-%m-%d", NewsArticle.published) == date_str
    ).order_by(NewsArticle.published.desc()).all()

def get_news_by_date_range(db: Session, start_date: str, end_date: str) -> List[NewsArticle]:
    """start_date, end_date in YYYY-MM-DD format"""
    return db.query(NewsArticle).filter(
        func.strftime("%Y-%m-%d", NewsArticle.published) >= start_date,
        func.strftime("%Y-%m-%d", NewsArticle.published) <= end_date
    ).order_by(NewsArticle.published.desc()).all()

def get_news_available_dates(db: Session) -> List[str]:
    rows = db.query(
        func.distinct(func.strftime("%Y-%m-%d", NewsArticle.published)).label("date")
    ).order_by(func.strftime("%Y-%m-%d", NewsArticle.published).desc()).all()
    return [r.date for r in rows if r.date]


# ── 2. Predictions (PredictionMemory) ─────────────────────────────────────────

def get_predictions(db: Session, symbol: str, limit: int = 20) -> List[PredictionMemory]:
    return db.query(PredictionMemory).filter(
        PredictionMemory.symbol == symbol
    ).order_by(PredictionMemory.created_at.desc()).limit(limit).all()

def count_predictions(db: Session, symbol: str) -> int:
    return db.query(func.count(PredictionMemory.id)).filter(
        PredictionMemory.symbol == symbol
    ).scalar() or 0

def create_prediction(db: Session, data: Dict[str, Any]) -> PredictionMemory:
    # Handle timestamp conversion if string
    created_at = data["timestamp"]
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)

    db_pred = PredictionMemory(
        symbol=data["symbol"],
        timeframe=data.get("timeframe", "1h"),
        prediction=data["bias"],
        confidence=data["confidence_score"],
        technical_score=data["technical_score"],
        sentiment_score=data["news_score"],
        market_regime=data.get("market_regime"),
        created_at=created_at,
        rsi_value=data.get("rsi_value"),
        macd_signal=data.get("macd_signal"),
        ema_trend=data.get("ema_trend"),
        momentum_signal=data.get("momentum_signal"),
        bb_signal=data.get("bb_signal"),
        atr_pct=data.get("atr_pct"),
        price_at_prediction=data["price_at_prediction"],
        active_setups=data.get("active_setups", "[]"),
    )
    db.add(db_pred)
    db.commit()
    db.refresh(db_pred)
    return db_pred

def get_pending_evaluations(db: Session, cutoff_time: datetime, horizon_label: str) -> List[PredictionMemory]:
    """
    Return predictions made <= cutoff_time that do NOT yet have an outcome for horizon_label.
    """
    # SQLite datetime comparisons can be done by parsing standard ISO strings or native python datetime objects.
    # SQLAlchemy handles python datetime objects cleanly.
    return db.query(PredictionMemory).filter(
        PredictionMemory.created_at <= cutoff_time
    ).filter(
        ~PredictionMemory.outcomes.any(PredictionOutcome.horizon == horizon_label)
    ).order_by(PredictionMemory.created_at.asc()).limit(100).all()


# ── 3. Outcomes (PredictionOutcome) ──────────────────────────────────────────

def get_outcomes(db: Session, symbol: str, limit: int = 50) -> List[PredictionOutcome]:
    return db.query(PredictionOutcome).join(
        PredictionMemory
    ).filter(
        PredictionMemory.symbol == symbol
    ).order_by(PredictionOutcome.evaluated_at.desc()).limit(limit).all()

def create_outcome(db: Session, data: Dict[str, Any]) -> PredictionOutcome:
    evaluated_at = data["evaluated_at"]
    if isinstance(evaluated_at, str):
        evaluated_at = datetime.fromisoformat(evaluated_at)

    success = (data["outcome"] == "CORRECT")

    db_outcome = PredictionOutcome(
        prediction_id=data["prediction_id"],
        horizon=data["horizon"],
        price_at_outcome=data["price_at_outcome"],
        price_change=data["price_change_pct"],
        outcome=data["outcome"],
        success=success,
        actual_direction=data.get("actual_direction", "Neutral"),
        evaluated_at=evaluated_at,
    )
    db.add(db_outcome)
    db.commit()
    db.refresh(db_outcome)
    return db_outcome

def get_raw_outcomes_for_symbol(db: Session, symbol: str, horizon: str = "1h") -> List[Dict[str, Any]]:
    rows = db.query(
        PredictionMemory.active_setups,
        PredictionMemory.prediction.label("bias"),
        PredictionOutcome.price_change.label("price_change_pct"),
        PredictionOutcome.outcome
    ).join(
        PredictionOutcome, PredictionMemory.id == PredictionOutcome.prediction_id
    ).filter(
        PredictionMemory.symbol == symbol,
        PredictionOutcome.horizon == horizon
    ).order_by(PredictionOutcome.evaluated_at.desc()).all()
    
    return [{"active_setups": r.active_setups, "bias": r.bias, "price_change_pct": r.price_change_pct, "outcome": r.outcome} for r in rows]


# ── 4. Setup Stats ────────────────────────────────────────────────────────────

def get_setup_stats(db: Session, symbol: str) -> List[SetupStats]:
    return db.query(SetupStats).filter(
        SetupStats.symbol == symbol
    ).order_by(SetupStats.win_rate.desc()).all()

def upsert_setup_stats(db: Session, stats: Dict[str, Any]) -> SetupStats:
    db_stats = db.query(SetupStats).filter(
        SetupStats.setup_name == stats["setup_name"],
        SetupStats.symbol == stats["symbol"]
    ).first()

    last_updated = stats.get("last_updated")
    if isinstance(last_updated, str):
        last_updated = datetime.fromisoformat(last_updated)

    if db_stats:
        db_stats.total_predictions = stats["total_predictions"]
        db_stats.correct_count = stats["correct_count"]
        db_stats.incorrect_count = stats["incorrect_count"]
        db_stats.neutral_count = stats["neutral_count"]
        db_stats.win_rate = stats["win_rate"]
        db_stats.avg_return_pct = stats["avg_return_pct"]
        db_stats.last_updated = last_updated
    else:
        db_stats = SetupStats(
            setup_name=stats["setup_name"],
            symbol=stats["symbol"],
            total_predictions=stats["total_predictions"],
            correct_count=stats["correct_count"],
            incorrect_count=stats["incorrect_count"],
            neutral_count=stats["neutral_count"],
            win_rate=stats["win_rate"],
            avg_return_pct=stats["avg_return_pct"],
            last_updated=last_updated,
        )
        db.add(db_stats)
    db.commit()
    db.refresh(db_stats)
    return db_stats


# ── 5. Adaptive Weights & History ─────────────────────────────────────────────

def get_all_weights(db: Session) -> List[AdaptiveWeight]:
    return db.query(AdaptiveWeight).order_by(AdaptiveWeight.weight_key).all()

def get_weight(db: Session, key: str, symbol: str = "GLOBAL") -> Optional[float]:
    row = db.query(AdaptiveWeight).filter(
        AdaptiveWeight.weight_key == key,
        AdaptiveWeight.symbol == symbol
    ).first()
    return row.value if row else None

def set_weight(db: Session, key: str, value: float, default_val: float, symbol: str = "GLOBAL") -> AdaptiveWeight:
    db_weight = db.query(AdaptiveWeight).filter(
        AdaptiveWeight.weight_key == key,
        AdaptiveWeight.symbol == symbol
    ).first()

    now = datetime.now(timezone.utc)
    if db_weight:
        db_weight.value = value
        db_weight.last_updated = now
    else:
        db_weight = AdaptiveWeight(
            weight_key=key,
            symbol=symbol,
            value=value,
            default_value=default_val,
            last_updated=now,
        )
        db.add(db_weight)
    db.commit()
    db.refresh(db_weight)
    return db_weight

def record_weight_history(db: Session, data: Dict[str, Any]) -> WeightHistory:
    changed_at = data["changed_at"]
    if isinstance(changed_at, str):
        changed_at = datetime.fromisoformat(changed_at)

    db_hist = WeightHistory(
        weight_key=data["weight_key"],
        symbol=data["symbol"],
        old_value=data["old_value"],
        new_value=data["new_value"],
        reason=data["reason"],
        changed_at=changed_at,
    )
    db.add(db_hist)
    db.commit()
    db.refresh(db_hist)
    return db_hist

def get_weight_history(db: Session, limit: int = 20) -> List[WeightHistory]:
    return db.query(WeightHistory).order_by(WeightHistory.changed_at.desc()).limit(limit).all()


# ── 6. Telegram Subscribers ───────────────────────────────────────────────────

def get_subscriber(db: Session, chat_id: str) -> Optional[TelegramSubscriber]:
    return db.query(TelegramSubscriber).filter(TelegramSubscriber.chat_id == chat_id).first()

def get_active_subscribers(db: Session) -> List[TelegramSubscriber]:
    return db.query(TelegramSubscriber).filter(TelegramSubscriber.is_active == True).all()

def update_subscriber_status(db: Session, chat_id: str, is_active: bool, default_filters: Dict[str, Any]) -> bool:
    sub = db.query(TelegramSubscriber).filter(TelegramSubscriber.chat_id == chat_id).first()
    changed = False
    if sub:
        if sub.is_active != is_active:
            sub.is_active = is_active
            changed = True
    else:
        if is_active:
            sub = TelegramSubscriber(
                chat_id=chat_id,
                is_active=True,
                filters=json.dumps(default_filters)
            )
            db.add(sub)
            changed = True
    if changed:
        db.commit()
    return changed

def toggle_subscriber_filter(db: Session, chat_id: str, filter_key: str, default_filters: Dict[str, Any]) -> bool:
    sub = db.query(TelegramSubscriber).filter(TelegramSubscriber.chat_id == chat_id).first()
    if not sub:
        sub = TelegramSubscriber(
            chat_id=chat_id,
            is_active=True,
            filters=json.dumps(default_filters)
        )
        db.add(sub)
        db.commit()
    
    try:
        prefs = json.loads(sub.filters or "{}")
    except Exception:
        prefs = dict(default_filters)
    
    current_val = prefs.get(filter_key, False)
    new_val = not current_val
    prefs[filter_key] = new_val
    
    sub.filters = json.dumps(prefs)
    db.commit()
    return new_val


# ── 7. Sent News Cache ────────────────────────────────────────────────────────

def load_sent_headlines(db: Session) -> Dict[str, str]:
    rows = db.query(SentNews).all()
    return {r.headline: r.sent_at.isoformat() for r in rows}

def add_sent_headline(db: Session, headline: str, sent_at: datetime) -> None:
    # Ignore duplicate primary key attempts
    exists = db.query(SentNews).filter(SentNews.headline == headline).first()
    if not exists:
        db_item = SentNews(headline=headline, sent_at=sent_at)
        db.add(db_item)
        db.commit()

def purge_expired_headlines(db: Session, cutoff_time: datetime) -> int:
    try:
        deleted = db.query(SentNews).filter(SentNews.sent_at < cutoff_time).delete()
        db.commit()
        return deleted
    except Exception:
        db.rollback()
        return 0

def cap_sent_headlines_growth(db: Session, max_stored: int) -> int:
    total = db.query(func.count(SentNews.headline)).scalar() or 0
    if total <= max_stored:
        return 0
    
    # Get the timestamp threshold of the N-th newest headline
    threshold_row = db.query(SentNews.sent_at).order_by(SentNews.sent_at.desc()).offset(max_stored).limit(1).first()
    if threshold_row:
        threshold = threshold_row[0]
        deleted = db.query(SentNews).filter(SentNews.sent_at <= threshold).delete()
        db.commit()
        return deleted
    return 0


# ── 8. Market Snapshots ───────────────────────────────────────────────────────

def create_market_snapshot(db: Session, data: Dict[str, Any]) -> MarketSnapshot:
    timestamp = data["timestamp"]
    if isinstance(timestamp, str):
        timestamp = datetime.fromisoformat(timestamp)

    db_snap = MarketSnapshot(
        symbol=data["symbol"],
        price=data["price"],
        volume=data["volume"],
        rsi=data.get("rsi"),
        macd=data.get("macd"),
        regime=data.get("regime"),
        timestamp=timestamp,
    )
    db.add(db_snap)
    db.commit()
    db.refresh(db_snap)
    return db_snap

def get_market_snapshots(db: Session, symbol: str, limit: int = 50) -> List[MarketSnapshot]:
    return db.query(MarketSnapshot).filter(
        MarketSnapshot.symbol == symbol
    ).order_by(MarketSnapshot.timestamp.desc()).limit(limit).all()
