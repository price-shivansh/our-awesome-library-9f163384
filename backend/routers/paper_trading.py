"""
routers/paper_trading.py — Paper Trading simulator API endpoints.

Migrated from paper_routes.py; the old file is kept as a shim so that
any code that still imports from it continues to work.
"""
import random
from typing import List
from fastapi import APIRouter, HTTPException
from schemas.paper_trading_schemas import (
    PaperOrderRequest, PaperPosition, PaperAccount,
    TradeHistoryItem, OrderLogItem,
)
from paper_trade import paper_engine, get_latest_price
from data_fetcher import data_fetcher

router = APIRouter(prefix="/api/paper-trading", tags=["paper-trading"])


@router.post("/order", response_model=PaperPosition)
async def place_order(req: PaperOrderRequest):
    try:
        return await paper_engine.place_order(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/open-positions", response_model=List[PaperPosition])
async def get_open_positions():
    return paper_engine.get_open_positions()


@router.get("/history", response_model=List[TradeHistoryItem])
async def get_trade_history():
    return paper_engine.get_trade_history()


@router.get("/orders", response_model=List[OrderLogItem])
async def get_order_history():
    return paper_engine.get_order_history()


@router.get("/account", response_model=PaperAccount)
async def get_account_summary():
    return paper_engine.get_account_summary()


@router.post("/close/{position_id}", response_model=TradeHistoryItem)
async def close_position(position_id: str):
    try:
        return await paper_engine.close_position(position_id, reason="MANUAL")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update")
async def update_positions():
    try:
        await paper_engine.update_positions()
        return {
            "open_positions": paper_engine.get_open_positions(),
            "account":        paper_engine.get_account_summary(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chart/{symbol}/{interval}")
async def get_chart(symbol: str, interval: str):
    """Reuse existing data_fetcher logic to query historical chart data with sufficient history."""
    interval_lower = interval.lower()
    
    # Mapping intervals to appropriate periods to guarantee minimum candle counts:
    # 1m  -> 300 candles (needs period="7d")
    # 5m  -> 200 candles (needs period="30d")
    # 15m -> 150 candles (needs period="30d")
    # 1H  -> 200 candles (needs period="60d")
    # 4H  -> 200 candles (needs period="1y")
    # 1D  -> 365 candles (needs period="2y")
    period_map = {
        "1m": "7d",
        "3m": "30d",
        "5m": "30d",
        "15m": "30d",
        "1h": "60d",
        "4h": "1y",
        "1d": "2y",
    }
    period = period_map.get(interval_lower, "30d")
    
    # Resolve exact yfinance interval
    yf_interval = interval_lower
    if interval_lower == "3m":
        yf_interval = "5m"  # Fallback to 5m as yfinance doesn't support 3m natively
    
    try:
        data = await data_fetcher.get_historical_data(
            symbol, period=period, interval=yf_interval
        )
        if not data:
            raise HTTPException(status_code=404, detail="Data not found")
        
        print(f"[Paper Trading Chart] Timeframe: {interval}, Candles Loaded: {len(data)}")
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/order-book/{symbol}")
async def get_mock_order_book(symbol: str):
    try:
        lp = await get_latest_price(symbol)
        spread = lp * 0.0005
        tick   = 0.5 if lp > 1000 else 0.05

        asks, ask_price = [], lp + spread
        for _ in range(8):
            asks.append({"price": round(ask_price, 2), "size": random.randint(10, 500)})
            ask_price += tick + (random.random() * tick * 2)

        bids, bid_price = [], lp - spread
        for _ in range(8):
            bids.append({"price": round(bid_price, 2), "size": random.randint(10, 500)})
            bid_price -= tick + (random.random() * tick * 2)

        return {
            "symbol":        symbol,
            "current_price": round(lp, 2),
            "asks":          asks[::-1],  # highest asks first
            "bids":          bids,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
