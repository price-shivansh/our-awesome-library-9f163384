import sys
sys.path.append('.')
import asyncio
from data_fetcher import data_fetcher

async def test_intervals():
    intervals = ["1m", "5m", "15m", "1h", "4h", "1d"]
    # Mapping intervals to appropriate periods as in paper_trading.py
    period_map = {
        "1m": "7d",
        "5m": "30d",
        "15m": "30d",
        "1h": "60d",
        "4h": "1y",
        "1d": "2y",
    }
    
    for interval in intervals:
        period = period_map[interval]
        print(f"--- Fetching {interval} (period={period}) ---")
        try:
            data = await data_fetcher.get_historical_data("CL=F", period=period, interval=interval)
            if data:
                print(f"Success: Loaded {len(data)} candles.")
                print(f"First candle date: {data[0]['date']}, Close: {data[0]['close']}")
                print(f"Last candle date: {data[-1]['date']}, Close: {data[-1]['close']}")
            else:
                print("Failed: No data returned.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_intervals())
