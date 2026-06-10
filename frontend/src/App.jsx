import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Activity, BarChart2,
  AlertTriangle, RefreshCw, Radio, Sun, Moon, ShieldAlert, Target, Info, ExternalLink, Calendar, X
} from 'lucide-react';

/* ── UI Components ── */
import IndexCard            from './components/market/IndexCard';
import MarketsPanel         from './components/market/MarketsPanel';
import SignalsPanel         from './components/signals/SignalsPanel';
import SentimentIndicator   from './components/sentiment/SentimentIndicator';
import SentimentBarChart    from './components/sentiment/SentimentBarChart';
import NewsFeed             from './components/news/NewsFeed';
import GlobalMarketSessions from './components/GlobalMarketSessions';
import BacktestPanel        from './components/BacktestPanel';
import TechnicalSummaryPage from './components/TechnicalSummaryPage';

/* ── Custom UI elements ── */
import LightweightChart     from './components/ui/LightweightChart';
import QuantPanelMock       from './components/quant/QuantPanelMock';

/* ── API base ── */
const getApiBase = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return '/api';
  return url.replace(/\/$/, '') + '/api';
};
const API_BASE = getApiBase();

const ALL_SYMBOLS = [
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
  'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'LT.NS', 'TATAPOWER.NS',
  '^NSEI', '^NSEBANK', '^BSESN',
  '^GSPC', '^DJI', '^IXIC', '^N225', '^HSI', '^GDAXI', '^FTSE',
  'GC=F', 'SI=F', 'CL=F', 'BZ=F', 'NG=F',
  'BTC-USD', 'ETH-USD', 'SOL-USD',
  'USDINR=X', 'EURINR=X', 'GBPINR=X'
];

const TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '1D', value: '1d' }
];

const getAssetType = (sym) => {
  if (!sym) return 'STOCK';
  if (sym.includes('=F')) return 'COMMODITY';
  if (sym.includes('=X')) return 'FOREX';
  if (sym.includes('-USD')) return 'CRYPTO';
  if (sym.startsWith('^')) return 'INDEX';
  return 'STOCK';
};

const ASSET_COLORS = { 
  STOCK: 'var(--bull)', 
  COMMODITY: 'var(--warn)', 
  FOREX: '#00eeff', 
  CRYPTO: '#a78bfa', 
  INDEX: '#ff66aa' 
};

// ── Searchable symbol picker ──────────────────────────────────────────────────
function SymbolSearch({ value, onChange }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = ALL_SYMBOLS.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  const select = (sym) => { setQuery(sym); onChange(sym); setOpen(false); };

  return (
    <div ref={wrapRef} style={{ position: 'relative', zIndex: 50, width: '140px' }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setFocused(true); setOpen(true); }}
        placeholder="Search symbol…"
        autoComplete="off" spellCheck={false}
        style={{
          background: 'var(--bg-base)', border: `1px solid ${focused ? 'var(--accent)' : 'var(--border-subtle)'}`,
          color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
          padding: '4px 8px', width: '100%', outline: 'none', borderRadius: '4px',
        }}
      />
      {open && filtered.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
          background: 'var(--bg-panel)', border: '1px solid var(--border-active)',
          borderTop: 'none', maxHeight: '180px', overflowY: 'auto',
          listStyle: 'none', margin: 0, padding: 0, borderRadius: '0 0 4px 4px'
        }}>
          {filtered.map(sym => (
            <li key={sym} onMouseDown={() => select(sym)} style={{
              padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
              color: sym === value ? 'var(--accent)' : 'var(--text-secondary)',
              background: sym === value ? 'var(--bg-panel-alt)' : 'transparent',
              cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-panel-alt)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = sym === value ? 'var(--bg-panel-alt)' : 'transparent'; e.currentTarget.style.color = sym === value ? 'var(--accent)' : 'var(--text-secondary)'; }}
            >
              {sym}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Simulated Level 2 Order Book ──────────────────────────────────────────
const SimulatedOrderBook = ({ symbol }) => {
  const [book, setBook] = useState({ asks: [], bids: [], currentPrice: 0 });

  useEffect(() => {
    if (!symbol) return;
    let mounted = true;

    const fetchBook = async () => {
      try {
        const res = await axios.get(`${API_BASE}/paper-trading/order-book/${encodeURIComponent(symbol)}`);
        if (!mounted) return;
        const data = res.data;
        const asks = data.asks.map(a => ({ ...a, total: 0 }));
        const bids = data.bids.map(b => ({ ...b, total: 0 }));
        
        let askTot = 0;
        for (let i = asks.length - 1; i >= 0; i--) { askTot += asks[i].size; asks[i].total = askTot; }
        let bidTot = 0;
        for (let i = 0; i < bids.length; i++) { bidTot += bids[i].size; bids[i].total = bidTot; }
        
        setBook({ asks, bids, currentPrice: data.current_price });
      } catch (e) {
        // fail silently
      }
    };

    fetchBook();
    const t = setInterval(fetchBook, 3000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [symbol]);

  if (!book.currentPrice || !book.bids.length) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
        WAITING FOR PRICE...
      </div>
    );
  }

  const maxVol = Math.max(
    book.asks[0]?.total || 1,
    book.bids[book.bids.length - 1]?.total || 1
  ) * 1.2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '2px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '4px 8px', borderBottom: '1px solid var(--border-subtle)', fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
        <div>PRICE</div>
        <div style={{ textAlign: 'right' }}>SIZE</div>
        <div style={{ textAlign: 'right' }}>TOTAL</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', padding: '4px' }}>
        {/* Asks (Sell Orders - Red) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {book.asks.slice(-5).map((a, i) => (
            <div key={`ask-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', padding: '2px 4px', position: 'relative' }}>
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${(a.total / maxVol) * 100}%`, background: 'rgba(248,81,73,0.08)', zIndex: 0 }} />
              <div style={{ zIndex: 1, color: 'var(--bear)' }}>{a.price.toFixed(2)}</div>
              <div style={{ zIndex: 1, textAlign: 'right', color: 'var(--text-primary)' }}>{a.size}</div>
              <div style={{ zIndex: 1, textAlign: 'right', color: 'var(--text-muted)' }}>{a.total}</div>
            </div>
          ))}
        </div>

        {/* Spread / Current Price */}
        <div style={{
          padding: '6px 4px', margin: '4px 0', textAlign: 'center',
          borderTop: '1px dashed var(--border-subtle)', borderBottom: '1px dashed var(--border-subtle)',
          background: 'var(--bg-panel-alt)'
        }}>
          <span className="holo-value" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {book.currentPrice.toFixed(2)}
          </span>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
            SPREAD: {(book.asks[book.asks.length - 1].price - book.bids[0].price).toFixed(2)}
          </div>
        </div>

        {/* Bids (Buy Orders - Green) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {book.bids.slice(0, 5).map((b, i) => (
            <div key={`bid-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', padding: '2px 4px', position: 'relative' }}>
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${(b.total / maxVol) * 100}%`, background: 'rgba(52,211,153,0.06)', zIndex: 0 }} />
              <div style={{ zIndex: 1, color: 'var(--bull)' }}>{b.price.toFixed(2)}</div>
              <div style={{ zIndex: 1, textAlign: 'right', color: 'var(--text-primary)' }}>{b.size}</div>
              <div style={{ zIndex: 1, textAlign: 'right', color: 'var(--text-muted)' }}>{b.total}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Toast Notifications ───────────────────────────────────────────────────
const TOAST_COLORS = { SUCCESS: 'var(--bull)', ERROR: 'var(--bear)', INFO: '#00eeff', WARN: 'var(--warn)' };
function ToastList({ toasts }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'var(--bg-panel)', border: `1px solid ${TOAST_COLORS[t.type] || 'var(--accent)'}`,
          padding: '8px 14px', fontFamily: 'Inter, sans-serif', fontSize: '11px',
          color: TOAST_COLORS[t.type] || 'var(--accent)', borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)', minWidth: '240px'
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: 'var(--text-muted)',
    marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px',
  }}>
    <span style={{ display: 'inline-block', width: '3px', height: '11px', background: 'var(--accent)', borderRadius: '2px' }} />
    {children}
  </div>
);

const Header = ({ children }) => (
  <header style={{
    background: 'var(--bg-panel)',
    borderBottom: '1px solid var(--border-subtle)',
    position: 'sticky', top: 0, zIndex: 100,
    backdropFilter: 'blur(12px)',
  }}>
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 16px' }}>
      {children}
    </div>
  </header>
);

/* ══════════════════════════════════════════
   MAIN APPLICATION
   ══════════════════════════════════════════ */
function App() {
  const navigate = useNavigate();
  const [marketData, setMarketData] = useState(null);
  const [marketsData, setMarketsData] = useState(null);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  /* Active Trading states */
  const [activeSymbol, setActiveSymbol] = useState('CL=F');
  const [activeInterval, setActiveInterval] = useState('15m');
  const [chartType, setChartType] = useState('candle');
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  /* Order state */
  const [direction, setDirection] = useState('BUY');
  const [quantity, setQuantity] = useState(10);
  const [stopLoss, setStopLoss] = useState('');
  const [target, setTarget] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placeErr, setPlaceErr] = useState('');

  /* Position state & account summaries */
  const [positions, setPositions] = useState({ open: [], closed: [], orders: [] });
  const [balance, setBalance] = useState(100000);
  const [realizedPnl, setRealizedPnl] = useState(0);
  const [unrealizedPnl, setUnrealizedPnl] = useState(0);
  const [totalEquity, setTotalEquity] = useState(100000);

  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'SUCCESS') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  /* Live WS stream indicator state */
  const [liveStreamOn, setLiveStreamOn] = useState(true);

  /* Theme settings */
  const [theme, setTheme] = useState(() => localStorage.getItem('dashTheme') || 'dark');
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('dashTheme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  /* Fetch generic market overview */
  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/market-overview`);
      setMarketData(res.data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMarketsData = useCallback(async () => {
    try {
      setMarketsLoading(true);
      const res = await axios.get(`${API_BASE}/markets/all`);
      setMarketsData(res.data);
    } catch (err) {
      console.error('Markets fetch error:', err);
    } finally {
      setMarketsLoading(false);
    }
  }, []);

  /* Fetch symbol-specific chart data */
  const fetchChartData = useCallback(async (sym, interval, isSilent = true) => {
    if (chartLoading) return;
    if (!isSilent) {
      showToast("Loading chart data...", "INFO");
    }
    setChartLoading(true);
    try {
      console.log("Reloading chart", sym, interval);
      const res = await axios.get(`${API_BASE}/paper-trading/chart/${encodeURIComponent(sym)}/${interval}`);
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setChartData(raw);
      console.log("Candles loaded:", raw.length);
      if (!isSilent) {
        showToast("Chart updated successfully", "SUCCESS");
      }
    } catch (e) {
      console.error(e);
      setChartData([]);
      if (!isSilent) {
        showToast("Failed to refresh chart", "ERROR");
      }
    } finally {
      setChartLoading(false);
    }
  }, [chartLoading]);

  /* Fetch Account statistics */
  const fetchTradingData = useCallback(async () => {
    try {
      const [oRes, cRes, aRes, ordRes] = await Promise.all([
        axios.get(`${API_BASE}/paper-trading/open-positions`),
        axios.get(`${API_BASE}/paper-trading/history`),
        axios.get(`${API_BASE}/paper-trading/account`),
        axios.get(`${API_BASE}/paper-trading/orders`)
      ]);
      setPositions({ open: oRes.data, closed: cRes.data, orders: ordRes.data });
      setBalance(aRes.data.available_capital);
      setRealizedPnl(aRes.data.realized_pnl);
      setUnrealizedPnl(aRes.data.unrealized_pnl);
      setTotalEquity(aRes.data.total_equity);
    } catch (e) {
      console.error('Error fetching paper trading positions:', e);
    }
  }, []);

  /* Set up continuous data syncing */
  useEffect(() => {
    fetchMarketData();
    fetchMarketsData();
    fetchTradingData();
    const i1 = setInterval(fetchMarketData, 60000);
    const i2 = setInterval(fetchMarketsData, 120000);
    const i3 = setInterval(fetchTradingData, 3000);
    return () => { clearInterval(i1); clearInterval(i2); clearInterval(i3); };
  }, [fetchMarketData, fetchMarketsData, fetchTradingData]);

  /* Sync chart data whenever active symbol or timeframe updates */
  useEffect(() => {
    fetchChartData(activeSymbol, activeInterval);
  }, [activeSymbol, activeInterval, fetchChartData]);

  // Auto-refresh chart data silently based on selected timeframe
  useEffect(() => {
    let intervalTime = null;
    const tf = activeInterval.toLowerCase();
    
    if (tf === '1m') {
      intervalTime = 30 * 1000; // 30 seconds
    } else if (tf === '5m') {
      intervalTime = 60 * 1000; // 60 seconds
    } else if (tf === '15m') {
      intervalTime = 5 * 60 * 1000; // 5 minutes
    } else if (tf === '1h') {
      intervalTime = 15 * 60 * 1000; // 15 minutes
    }
    
    if (intervalTime) {
      const timer = setInterval(() => {
        fetchChartData(activeSymbol, activeInterval, true);
      }, intervalTime);
      return () => clearInterval(timer);
    }
  }, [activeSymbol, activeInterval, fetchChartData]);

  const handleSymbolChange = (sym) => {
    setActiveSymbol(sym);
  };

  const handleInstrumentClick = (item) => {
    setActiveSymbol(item.symbol);
  };

  const handleClosePosition = async (id) => {
    try {
      await axios.post(`${API_BASE}/paper-trading/close/${id}`);
      fetchTradingData();
      showToast('Position closed manually.', 'INFO');
    } catch (e) {
      showToast('Error closing position', 'ERROR');
    }
  };

  const handlePlaceOrder = async () => {
    setPlaceErr('');
    const qty = Number(quantity);
    const sl  = Number(stopLoss);
    const tgt = Number(target);
    const price = chartData[chartData.length - 1]?.close || 0;

    if (!activeSymbol) { setPlaceErr('Symbol is required.'); return; }
    if (qty <= 0) { setPlaceErr('Quantity must be > 0.'); return; }
    if (!stopLoss || !target) { setPlaceErr('SL and Target are required.'); return; }
    if (sl <= 0 || tgt <= 0) { setPlaceErr('SL and Target must be positive.'); return; }
    if (balance <= 0) { setPlaceErr('Sim account limit hit.'); return; }

    if (price > 0) {
      if (direction === 'BUY') {
        if (sl >= price) { setPlaceErr('BUY: Stop Loss must be BELOW market price.'); return; }
        if (tgt <= price) { setPlaceErr('BUY: Target must be ABOVE market price.'); return; }
      } else {
        if (sl <= price) { setPlaceErr('SELL: Stop Loss must be ABOVE market price.'); return; }
        if (tgt >= price) { setPlaceErr('SELL: Target must be BELOW market price.'); return; }
      }
    }

    setPlacing(true);
    const assetStr = getAssetType(activeSymbol).toLowerCase();
    const asset_type = assetStr === 'index' ? 'stock' : assetStr;

    try {
      await axios.post(`${API_BASE}/paper-trading/order`, {
        symbol: activeSymbol,
        asset_type,
        side: direction.toLowerCase(),
        quantity: qty,
        stop_loss: sl,
        target: tgt,
        timeframe: activeInterval
      });
      setStopLoss('');
      setTarget('');
      fetchTradingData();
      showToast(`✅ Executed: ${direction} ${qty}× ${activeSymbol}`, 'SUCCESS');
    } catch (e) {
      const msg = e.response?.data?.detail || 'Error executing trade.';
      setPlaceErr(msg);
      showToast(`⚠ Order failed: ${msg}`, 'ERROR');
    } finally {
      setPlacing(false);
    }
  };

  // Derive LTP parameters
  const currentPrice = chartData[chartData.length - 1]?.close || 0;
  const priceChange = chartData.length > 1 ? currentPrice - chartData[0].close : 0;
  const isLtpUp = priceChange >= 0;
  const ltpColor = isLtpUp ? 'var(--bull)' : 'var(--bear)';

  const riskAmount = stopLoss && !isNaN(stopLoss) ? Math.abs(currentPrice - Number(stopLoss)) * quantity : 0;
  const riskPercent = balance > 0 ? (riskAmount / balance) * 100 : 0;
  const expectedRiskColor = riskPercent > 3 ? 'var(--bear)' : 'var(--text-secondary)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <ToastList toasts={toasts} />

      {/* ── COMMAND TOOLBAR ── */}
      <Header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '52px', gap: '16px' }}>
          
          {/* Logo & Symbol Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={15} style={{ color: 'var(--accent)' }} />
              </div>
              <h1 className="holo-title" style={{ fontSize: '12px', letterSpacing: '0.05em', margin: 0, textTransform: 'uppercase' }}>
                Quant Decision Engine
              </h1>
            </div>
            
            <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />
            
            {/* Symbol picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SymbolSearch value={activeSymbol} onChange={handleSymbolChange} />
              
              {/* Presets */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {['CL=F', '^NSEI', 'BTC-USD', 'RELIANCE.NS'].map(presetSym => (
                  <button
                    key={presetSym}
                    onClick={() => handleSymbolChange(presetSym)}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', padding: '3px 6px',
                      background: activeSymbol === presetSym ? 'var(--accent-dim)' : 'var(--bg-panel-alt)',
                      border: `1px solid ${activeSymbol === presetSym ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      color: activeSymbol === presetSym ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer', borderRadius: '3px'
                    }}
                  >
                    {presetSym.replace('.NS', '').replace('-USD', '')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timeframe & Status badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            {/* Timeframes */}
            <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-panel-alt)', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.value}
                  onClick={() => setActiveInterval(tf.value)}
                  style={{
                    fontSize: '10px', fontWeight: 600, padding: '3px 8px', border: 'none', cursor: 'pointer',
                    background: activeInterval === tf.value ? 'var(--bg-panel)' : 'transparent',
                    color: activeInterval === tf.value ? 'var(--accent)' : 'var(--text-muted)',
                    borderRadius: '2px'
                  }}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Status indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 600 }}>
              
              {/* LIVE indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', background: 'rgba(52,211,153,0.06)', border: '1px solid var(--bull-border)', color: 'var(--bull)', borderRadius: '3px' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--bull)', display: 'inline-block' }} />
                <span>LIVE</span>
              </div>

              {/* AI Active indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', borderRadius: '3px' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} />
                <span>AI ACTIVE</span>
              </div>

              {/* Market Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', borderRadius: '3px' }}>
                <span>MARKET OPEN</span>
              </div>

              {/* Data status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', background: 'rgba(210,153,34,0.06)', border: '1px solid var(--warn-border)', color: 'var(--warn)', borderRadius: '3px' }}>
                <span>DATA DELAYED</span>
              </div>
            </div>

            <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />

            {/* Utility actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button onClick={() => navigate('/technical-summary')} className="holo-btn btn-accent" style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 600 }}>
                ⚡ Technical Summary
              </button>

              {/* Theme toggle */}
              <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Theme">
                <div className="theme-toggle-icon">
                  {theme === 'dark' ? <Sun size={11} color="var(--accent)" /> : <Moon size={11} color="var(--text-primary)" />}
                </div>
              </button>

              {/* Manual refresh */}
              <button onClick={fetchMarketData} disabled={loading} className="holo-btn" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}>
                <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

          </div>
        </div>
      </Header>

      {/* ── MAIN LAYOUT GRID ── */}
      <main style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        
        {error && (
          <div style={{ padding: '8px 12px', background: 'var(--bear-dim)', border: '1px solid var(--bear-border)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--bear)' }}>
            <AlertTriangle size={14} style={{ shrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ── ROW 1: THE HERO (CHART & QUANT ENGINE) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(320px, 1fr)', gap: '12px' }}>
          
          {/* Hero Chart container */}
          <div className="holo-panel" style={{ display: 'flex', flexDirection: 'column', minHeight: '520px', background: 'var(--bg-panel)' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="holo-value" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeSymbol}
                </span>
                {currentPrice > 0 && (
                  <span className="holo-value" style={{ fontSize: '13px', fontWeight: 700, color: ltpColor }}>
                    {currentPrice.toFixed(currentPrice >= 100 ? 2 : 4)}
                  </span>
                )}
                <span style={{ fontSize: '9px', fontWeight: 600, padding: '1px 5px', border: `1px solid ${ASSET_COLORS[getAssetType(activeSymbol)]}40`, color: ASSET_COLORS[getAssetType(activeSymbol)], textTransform: 'uppercase' }}>
                  {getAssetType(activeSymbol)}
                </span>
                {chartLoading && (
                  <span style={{ fontSize: '9px', color: 'var(--warn)' }}>FETCHING DATA…</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setChartType('line')} style={{ fontSize: '9px', padding: '2px 6px', background: chartType === 'line' ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${chartType === 'line' ? 'var(--accent)' : 'var(--border-subtle)'}`, color: chartType === 'line' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '3px' }}>
                  LINE
                </button>
                <button onClick={() => setChartType('candle')} style={{ fontSize: '9px', padding: '2px 6px', background: chartType === 'candle' ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${chartType === 'candle' ? 'var(--accent)' : 'var(--border-subtle)'}`, color: chartType === 'candle' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '3px' }}>
                  CANDLE
                </button>
                <button 
                  onClick={() => fetchChartData(activeSymbol, activeInterval, false)} 
                  disabled={chartLoading}
                  style={{ 
                    fontSize: '9px', 
                    padding: '2px 6px', 
                    background: 'transparent', 
                    border: '1px solid var(--border-subtle)', 
                    color: chartLoading ? 'var(--text-muted)' : 'var(--accent)', 
                    cursor: chartLoading ? 'not-allowed' : 'pointer', 
                    borderRadius: '3px',
                    opacity: chartLoading ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}
                  title="Refresh Chart"
                >
                  {chartLoading ? '🔄...' : '🔄'}
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, padding: '12px 6px 12px 0' }}>
              {chartData.length === 0 && !chartLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '11px' }}>
                  NO HISTORICAL CHART DATA AVAILABLE FOR {activeSymbol}
                </div>
              ) : (
                <LightweightChart data={chartData} type={chartType} height={460} timeframe={activeInterval} />
              )}
            </div>
          </div>

          {/* Quant decision panel */}
          <QuantPanelMock 
            symbol={activeSymbol} 
            onApplyPlan={(plan) => {
              setDirection(plan.direction);
              setStopLoss(plan.stopLoss.toString());
              setTarget(plan.target.toString());
            }}
          />
        </div>

        {/* ── ROW 2: TRADING CONTROLS, ORDER BOOK & ACCOUNT LEDGER ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 240px minmax(0, 1fr)', gap: '12px' }}>
          
          {/* Order Form */}
          <div className="holo-panel" style={{ background: 'var(--bg-panel)', display: 'flex', flexDirection: 'column' }}>
            <div className="panel-header">📋 EXECUTE ORDER</div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              
              {/* Buy/Sell Direction */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setDirection('BUY')} style={{
                  flex: 1, padding: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                  background: direction === 'BUY' ? 'var(--bull-dim)' : 'transparent',
                  border: `1px solid ${direction === 'BUY' ? 'var(--bull)' : 'var(--border-subtle)'}`,
                  color: direction === 'BUY' ? 'var(--bull)' : 'var(--text-secondary)',
                  borderRadius: '3px'
                }}>▲ BUY / LONG</button>
                
                <button onClick={() => setDirection('SELL')} style={{
                  flex: 1, padding: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                  background: direction === 'SELL' ? 'var(--bear-dim)' : 'transparent',
                  border: `1px solid ${direction === 'SELL' ? 'var(--bear)' : 'var(--border-subtle)'}`,
                  color: direction === 'SELL' ? 'var(--bear)' : 'var(--text-secondary)',
                  borderRadius: '3px'
                }}>▼ SELL / SHORT</button>
              </div>

              {/* Quantity */}
              <div>
                <label style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>QUANTITY</label>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)} 
                  style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '5px 8px', fontSize: '11px', borderRadius: '3px', outline: 'none' }}
                />
              </div>

              {/* Stop Loss */}
              <div>
                <label style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>STOP LOSS</label>
                <input 
                  type="number" 
                  value={stopLoss} 
                  onChange={e => setStopLoss(e.target.value)} 
                  placeholder="SL Price"
                  style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '5px 8px', fontSize: '11px', borderRadius: '3px', outline: 'none' }}
                />
              </div>

              {/* Target */}
              <div>
                <label style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>TARGET</label>
                <input 
                  type="number" 
                  value={target} 
                  onChange={e => setTarget(e.target.value)} 
                  placeholder="TP Price"
                  style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '5px 8px', fontSize: '11px', borderRadius: '3px', outline: 'none' }}
                />
              </div>

              {/* Risk metrics */}
              {currentPrice > 0 && stopLoss && !isNaN(stopLoss) && (
                <div style={{ padding: '6px 8px', background: riskPercent > 3 ? 'rgba(248,81,73,0.06)' : 'var(--bg-panel-alt)', border: `1px solid ${riskPercent > 3 ? 'var(--bear-border)' : 'var(--border-subtle)'}`, borderRadius: '3px', fontSize: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: expectedRiskColor }}>
                    <span>Risk Amount:</span>
                    <span>₹{riskAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: expectedRiskColor, marginTop: '2px' }}>
                    <span>Risk Percent:</span>
                    <span>{riskPercent.toFixed(1)}% of capital</span>
                  </div>
                  {riskPercent > 3 && (
                    <div style={{ color: 'var(--bear)', fontWeight: 700, fontSize: '8px', textTransform: 'uppercase', marginTop: '4px' }}>
                      [!] HIGH RISK ALERT (&gt;3%)
                    </div>
                  )}
                </div>
              )}

              {placeErr && <div style={{ fontSize: '10px', color: 'var(--bear)' }}>⚠ {placeErr}</div>}

              {/* Execute Trade Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={placing || balance <= 0}
                style={{
                  width: '100%', marginTop: 'auto', background: balance <= 0 ? 'transparent' : 'var(--accent)',
                  border: `1px solid ${balance <= 0 ? 'var(--bear)' : 'var(--accent-border)'}`,
                  color: balance <= 0 ? 'var(--bear)' : 'var(--bg-base)', padding: '8px', fontSize: '11px', fontWeight: 700,
                  borderRadius: '4px', cursor: 'pointer'
                }}
              >
                {balance <= 0 ? 'ACCOUNT BLOWN' : placing ? 'EXECUTING…' : `⚡ EXECUTE ${direction}`}
              </button>

            </div>
          </div>

          {/* Level 2 Depth Order Book */}
          <div className="holo-panel" style={{ background: 'var(--bg-panel)', display: 'flex', flexDirection: 'column' }}>
            <div className="panel-header">📚 ORDER DEPTH (L2)</div>
            <div style={{ flex: 1 }}>
              <SimulatedOrderBook symbol={activeSymbol} />
            </div>
          </div>

          {/* Positions, Account balances and ledger */}
          <div className="holo-panel" style={{ background: 'var(--bg-panel)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🟢 ACTIVE POSITIONS ({positions.open.length})</span>
              <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>Cap: <strong className="holo-value" style={{ color: 'var(--text-primary)' }}>₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</strong></span>
                <span>PnL: <strong className="holo-value" style={{ color: unrealizedPnl >= 0 ? 'var(--bull)' : 'var(--bear)' }}>₹{unrealizedPnl.toFixed(1)}</strong></span>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {positions.open.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  No open paper trading positions. Use the form on the left to execute order.
                </div>
              ) : (
                <table className="holo-table" style={{ width: '100%', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-panel-alt)' }}>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Symbol</th>
                      <th style={{ textAlign: 'right', padding: '6px' }}>Dir</th>
                      <th style={{ textAlign: 'right', padding: '6px' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '6px' }}>Entry</th>
                      <th style={{ textAlign: 'right', padding: '6px' }}>Current</th>
                      <th style={{ textAlign: 'right', padding: '6px' }}>PnL</th>
                      <th style={{ textAlign: 'right', padding: '6px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.open.map((pos) => {
                      const isBull = pos.side.toUpperCase() === 'BUY';
                      const sideColor = isBull ? 'var(--bull)' : 'var(--bear)';
                      const pnl = pos.unrealized_pnl || 0;
                      return (
                        <tr key={pos.id}>
                          <td style={{ padding: '6px', fontWeight: 600 }}>{pos.symbol}</td>
                          <td style={{ padding: '6px', textAlign: 'right', color: sideColor, fontWeight: 700 }}>{pos.side.toUpperCase()}</td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>{pos.quantity}</td>
                          <td style={{ padding: '6px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>{pos.entry_price.toFixed(2)}</td>
                          <td style={{ padding: '6px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>{pos.current_price?.toFixed(2) || '0.00'}</td>
                          <td style={{ padding: '6px', textAlign: 'right', color: pnl >= 0 ? 'var(--bull)' : 'var(--bear)', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                            {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}
                          </td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleClosePosition(pos.id)}
                              style={{
                                background: 'transparent', border: '1px solid var(--bear-border)', color: 'var(--bear)',
                                fontSize: '9px', fontWeight: 600, padding: '2px 6px', cursor: 'pointer', borderRadius: '3px'
                              }}
                            >
                              CLOSE
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* ── ROW 3: MARKET INTELLIGENCE & NEWS FEED ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(320px, 1fr)', gap: '12px' }}>
          
          {/* Index Cards & World Markets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Market Indices (Merged cards + mini charts) */}
            <div>
              <SectionLabel>Market Intelligence Summary</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <IndexCard data={marketData?.nifty} symbol="^NSEI" name="NIFTY 50" />
                <IndexCard data={marketData?.banknifty} symbol="^NSEBANK" name="NIFTY BANK" />
                <IndexCard data={marketData?.sensex} symbol="^BSESN" name="SENSEX" />
              </div>
            </div>

            {/* World Markets & extra summaries */}
            <div style={{ flex: 1 }}>
              <div className="holo-panel" style={{ background: 'var(--bg-panel)' }}>
                <div className="panel-header">🌐 WORLD MARKETS TERMINAL</div>
                <div style={{ padding: '10px' }}>
                  <MarketsPanel marketsData={marketsData} loading={marketsLoading} onStockClick={handleInstrumentClick} />
                </div>
              </div>
            </div>

          </div>

          {/* News Feed panel */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <NewsFeed news={marketData?.market_sentiment?.news_items} />
          </div>

        </div>

        {/* ── ROW 4: STRATEGY BACKTESTER ── */}
        <div>
          <SectionLabel>Strategy Backtester Terminal</SectionLabel>
          <BacktestPanel />
        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 16px', textAlign: 'center', background: 'var(--bg-panel)', marginTop: '24px' }}>
        <p className="holo-text" style={{ fontSize: '10px', margin: 0 }}>
          Quant Decision Terminal · Data feed: Yahoo Finance · System latency: Delayed 15–20 min · Educational Simulator Only
        </p>
      </footer>
    </div>
  );
}

const AppWrapper = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/"                   element={<App />} />
      <Route path="/technical-summary"  element={<TechnicalSummaryPage />} />
    </Routes>
  </BrowserRouter>
);

export default AppWrapper;
