"""
models.py — SQLAlchemy ORM models for unified quant database.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, UniqueConstraint, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from database.db import Base

class NewsArticle(Base):
    """
    Table: news_articles
    Stores parsed and analyzed news articles.
    """
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    headline = Column(String, nullable=False, index=True)
    summary = Column(String, nullable=True)
    source = Column(String, nullable=False)
    url = Column(String, nullable=False, unique=True, index=True)
    published = Column(DateTime, nullable=False)
    sentiment = Column(String, nullable=False)  # BULLISH | BEARISH | NEUTRAL
    impact_score = Column(Float, nullable=False)  # Maps to sentiment_score
    first_seen_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    category = Column(String, nullable=False, index=True)  # Global Markets, Crypto, etc.
    related_symbols = Column(String, nullable=True)  # Comma-separated list

    __table_args__ = (
        UniqueConstraint("headline", "source", "published", name="uix_headline_source_published"),
    )


class PredictionMemory(Base):
    """
    Table: prediction_memory
    Stores generated market predictions and context indicators.
    """
    __tablename__ = "prediction_memory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String, nullable=False, index=True)
    timeframe = Column(String, nullable=False, default="1h")
    prediction = Column(String, nullable=False)  # Bullish | Bearish | Neutral (maps to bias)
    confidence = Column(Float, nullable=False)  # Maps to confidence_score
    technical_score = Column(Float, nullable=False)
    sentiment_score = Column(Float, nullable=False)  # Maps to news_score
    market_regime = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, index=True)  # Maps to timestamp

    # Backward compatibility indicators
    rsi_value = Column(Float, nullable=True)
    macd_signal = Column(String, nullable=True)
    ema_trend = Column(String, nullable=True)
    momentum_signal = Column(String, nullable=True)
    bb_signal = Column(String, nullable=True)
    atr_pct = Column(Float, nullable=True)
    price_at_prediction = Column(Float, nullable=False)
    active_setups = Column(String, nullable=True, default="[]")  # JSON string

    outcomes = relationship("PredictionOutcome", back_populates="prediction", cascade="all, delete-orphan")


class PredictionOutcome(Base):
    """
    Table: prediction_outcomes
    Stores target performance evaluations of predictions at set horizons.
    """
    __tablename__ = "prediction_outcomes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey("prediction_memory.id"), nullable=False, index=True)
    actual_direction = Column(String, nullable=False)  # Bullish | Bearish | Neutral
    success = Column(Boolean, nullable=False)  # True if outcome == CORRECT
    price_change = Column(Float, nullable=False)  # Maps to price_change_pct
    evaluated_at = Column(DateTime, nullable=False)

    # Backward compatibility fields
    horizon = Column(String, nullable=False)  # 15m, 1h, 4h
    price_at_outcome = Column(Float, nullable=False)
    outcome = Column(String, nullable=False)  # CORRECT | INCORRECT | NEUTRAL

    prediction = relationship("PredictionMemory", back_populates="outcomes")

    __table_args__ = (
        UniqueConstraint("prediction_id", "horizon", name="uix_prediction_horizon"),
    )


class MarketSnapshot(Base):
    """
    Table: market_snapshots
    Stores high-density ticker data snapshots.
    """
    __tablename__ = "market_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False)
    volume = Column(Integer, nullable=False)
    rsi = Column(Float, nullable=True)
    macd = Column(Float, nullable=True)
    regime = Column(String, nullable=True)
    timestamp = Column(DateTime, nullable=False, index=True)


class SetupStats(Base):
    """
    Table: setup_stats
    Aggregated historical performance of specific indicator setups.
    """
    __tablename__ = "setup_stats"

    setup_name = Column(String, primary_key=True)
    symbol = Column(String, primary_key=True)
    total_predictions = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    neutral_count = Column(Integer, default=0)
    win_rate = Column(Float, default=0.0)
    avg_return_pct = Column(Float, default=0.0)
    last_updated = Column(DateTime, nullable=True)

    __table_args__ = (
        PrimaryKeyConstraint("setup_name", "symbol", name="pk_setup_stats"),
    )


class AdaptiveWeight(Base):
    """
    Table: adaptive_weights
    Current active weights optimized dynamically by the system.
    """
    __tablename__ = "adaptive_weights"

    weight_key = Column(String, primary_key=True)
    symbol = Column(String, primary_key=True, default="GLOBAL")
    value = Column(Float, nullable=False)
    default_value = Column(Float, nullable=False)
    last_updated = Column(DateTime, nullable=True)

    __table_args__ = (
        PrimaryKeyConstraint("weight_key", "symbol", name="pk_adaptive_weights"),
    )


class WeightHistory(Base):
    """
    Table: weight_history
    Tracks historical weight parameter updates and reason logs.
    """
    __tablename__ = "weight_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    weight_key = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    old_value = Column(Float, nullable=False)
    new_value = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    changed_at = Column(DateTime, nullable=False)


class TelegramSubscriber(Base):
    """
    Table: telegram_subscribers
    Stores active Telegram chat subscribers and alert filter selections.
    """
    __tablename__ = "telegram_subscribers"

    chat_id = Column(String, primary_key=True)
    is_active = Column(Boolean, default=True, nullable=False)
    filters = Column(String, nullable=True, default="{}")  # JSON string


class SentNews(Base):
    """
    Table: sent_news
    Deduplication cache for telegram news alert broadcasts.
    """
    __tablename__ = "sent_news"

    headline = Column(String, primary_key=True)
    sent_at = Column(DateTime, nullable=False)
