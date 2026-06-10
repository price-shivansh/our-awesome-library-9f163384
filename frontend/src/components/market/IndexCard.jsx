import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { AreaChart, Area, YAxis, ResponsiveContainer } from 'recharts';

const getApiBase = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return '/api';
  return url.replace(/\/$/, '') + '/api';
};
const API_BASE = getApiBase();

const IndexCard = ({ data, symbol, name }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    axios.get(`${API_BASE}/historical/${encodeURIComponent(symbol)}?period=3mo`)
      .then(r => {
        const d = r.data?.data || [];
        const step = Math.max(1, Math.floor(d.length / 50));
        setChartData(d.filter((_, i) => i % step === 0));
      })
      .catch(() => setChartData([]))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (!data) {
    return (
      <div className="holo-panel p-3" style={{ minHeight: '130px' }}>
        <div className="holo-skeleton" style={{ height: '11px', width: '80px', marginBottom: '10px' }} />
        <div className="holo-skeleton" style={{ height: '22px', width: '120px', marginBottom: '8px' }} />
        <div className="holo-skeleton" style={{ height: '50px', width: '100%' }} />
      </div>
    );
  }

  const isPositive = data.change >= 0;
  const priceColor = isPositive ? 'var(--bull)' : 'var(--bear)';
  const min = chartData.length ? Math.min(...chartData.map(d => d.low)) * 0.999 : 0;
  const max = chartData.length ? Math.max(...chartData.map(d => d.high)) * 1.001 : 0;

  return (
    <div
      className="holo-panel p-3 transition-colors"
      style={{
        borderLeft: `3px solid ${priceColor}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        background: 'var(--bg-panel)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          {name}
        </span>
        <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{symbol}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <span className="holo-value" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {data.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
          <span className="holo-value" style={{ fontSize: '11px', color: priceColor, marginLeft: '8px' }}>
            {isPositive ? '+' : ''}{data.change_percent?.toFixed(2)}%
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          {isPositive ? <ChevronUp size={11} style={{ color: 'var(--bull)', marginRight: '2px' }} /> : <ChevronDown size={11} style={{ color: 'var(--bear)', marginRight: '2px' }} />}
          {isPositive ? '+' : ''}{data.change?.toFixed(2)}
        </span>
      </div>

      {/* Embedded Mini-Chart */}
      <div style={{ height: '40px', width: '100%', marginTop: '2px' }}>
        {loading ? (
          <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Loading...</span>
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--bear)' }}>No Data</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <defs>
                <linearGradient id={`grad-card-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={priceColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={priceColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={[min, max]} hide />
              <Area
                type="monotone"
                dataKey="close"
                stroke={priceColor}
                strokeWidth={1.2}
                fill={`url(#grad-card-${symbol})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default IndexCard;
