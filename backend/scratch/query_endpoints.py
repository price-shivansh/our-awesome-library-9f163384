import urllib.request
import json

intervals = ["1m", "5m", "15m", "1h", "4h", "1d"]

for interval in intervals:
    url = f"http://127.0.0.1:8001/api/paper-trading/chart/CL=F/{interval}"
    try:
        req = urllib.request.urlopen(url)
        data = json.loads(req.read().decode())
        print(f"Interval: {interval}, Length: {len(data)}")
        if data:
            print(f"  First: {data[0]['date']} (Close: {data[0]['close']})")
            print(f"  Last: {data[-1]['date']} (Close: {data[-1]['close']})")
    except Exception as e:
        print(f"Interval: {interval}, Error: {e}")
