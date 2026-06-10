import re, os, glob

router_dir = r'c:\Users\mail2\OneDrive\Desktop\Global market\backend\routers'
files = glob.glob(os.path.join(router_dir, '*.py'))

print('=== ALL BACKEND ROUTE PATHS ===')
all_routes = []
for f in sorted(files):
    name = os.path.basename(f)
    content = open(f, encoding='utf-8').read()
    routes = re.findall(r'''@router\.\w+\(["\'](.*?)["\']''', content)
    prefix_m = re.search(r'''APIRouter\([^)]*prefix=["\'](.*?)["\']''', content)
    prefix = prefix_m.group(1) if prefix_m else ''
    for r in routes:
        full = prefix + r
        all_routes.append(full)
        print(f'  {name}: {full}')

print()
print('=== CHECK 6 REQUIRED ENDPOINTS ===')
required = [
    '/api/markets/all',
    '/api/market-overview',
    '/api/historical/{symbol}',
    '/api/news/history/dates',
    '/api/news/history',
    '/api/technical-summary/{symbol}/{interval}',
]
for r in required:
    status = 'PASS' if r in all_routes else 'FAIL'
    print(f'  {status}: {r}')
