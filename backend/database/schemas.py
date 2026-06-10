"""
schemas.py — Pydantic schema validation shim.
Imports existing schemas for quantitative models, predictions, and outcomes.
"""
# Re-exporting from schemas/ package to keep models and schemas tidy
from schemas.market_schemas import NewsItem, MarketSentiment
from schemas.quant_schemas import (
    PredictionSnapshot,
    OutcomeRecord,
    SetupStats,
    AdaptiveWeight,
    WeightHistory,
)
