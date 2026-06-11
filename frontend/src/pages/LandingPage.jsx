/**
 * LandingPage.jsx — Public marketing landing page.
 *
 * Sections:
 *   1. Hero
 *   2. Features (6-card grid)
 *   3. How It Works (3-step)
 *   4. Dashboard Preview (static terminal mockup)
 *   5. CTA Section
 *   6. Footer
 *
 * Design: Bloomberg Terminal / TradingView aesthetic
 * Uses existing CSS design tokens from index.css
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Icon components (inline SVG — no extra lib needed) ────────────────────────
const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  chart:    "M3 3v18h18M7 16l4-4 4 4 4-4",
  brain:    "M9.5 2a2.5 2.5 0 0 1 5 0v1a2.5 2.5 0 0 1-2.5 2.5M9.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M15 9l3 3-3 3",
  news:     "M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2zM8 6h8M8 10h8M8 14h4",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",
  globe:    "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  signal:   "M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16",
  lock:     "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  arrow:    "M5 12h14M12 5l7 7-7 7",
  check:    "M20 6L9 17l-5-5",
  zap:      "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
};

const features = [
  {
    icon: "chart",
    title: "Live Market Data",
    desc: "Real-time Nifty, BankNifty, Sensex, global indices, commodities, forex, and crypto — all in one terminal.",
  },
  {
    icon: "brain",
    title: "Quant Decision Engine",
    desc: "AI-driven multi-timeframe analysis with confidence scoring, regime detection, and trade state classification.",
  },
  {
    icon: "news",
    title: "News Intelligence",
    desc: "Automated sentiment analysis across 50+ sources. Market-impact scoring for crude oil, gold, crypto, and equities.",
  },
  {
    icon: "signal",
    title: "Technical Signals",
    desc: "RSI, MACD, Bollinger Bands, EMA crossovers, and volume analysis distilled into clear BUY / SELL / HOLD signals.",
  },
  {
    icon: "shield",
    title: "Paper Trading",
    desc: "Trade stocks, commodities, and forex with virtual capital. Auto stop-loss and target tracking with full PnL ledger.",
  },
  {
    icon: "globe",
    title: "Global Coverage",
    desc: "S&P 500, Dow Jones, NASDAQ, DAX, Nikkei, and 8 currency pairs — all correlated with Indian market exposure.",
  },
];

const steps = [
  {
    n: "01",
    title: "Connect to Markets",
    desc: "Live price feeds initialize automatically. No API keys needed — data streams directly from verified financial sources.",
  },
  {
    n: "02",
    title: "Analyze with AI",
    desc: "The Quant Engine processes technicals and sentiment in parallel, generating a unified confidence score and bias.",
  },
  {
    n: "03",
    title: "Execute with Precision",
    desc: "Review AI-generated entry zones, stop-loss, and targets. Execute in paper trading or apply to your real broker.",
  },
];

// ── Ticker data ────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { sym: "NIFTY 50", val: "24,138.85", chg: "+0.42%" },
  { sym: "BANKNIFTY", val: "51,892.10", chg: "+0.67%" },
  { sym: "SENSEX", val: "79,441.20", chg: "+0.38%" },
  { sym: "BTC/USD", val: "103,421.00", chg: "+1.24%" },
  { sym: "GOLD", val: "3,312.40", chg: "-0.11%" },
  { sym: "CRUDE OIL", val: "77.85", chg: "+0.56%" },
  { sym: "USD/INR", val: "84.32", chg: "-0.03%" },
  { sym: "S&P 500", val: "5,941.80", chg: "+0.29%" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: 'var(--text-primary)', overflowX: 'hidden' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(13,17,23,0.96)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'all 0.3s ease',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '60px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICONS.zap} size={14} />
          </div>
          <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
            Quant<span style={{ color: 'var(--accent)' }}>DE</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            id="landing-login-btn"
            onClick={() => navigate('/login')}
            style={{
              background: 'transparent', border: '1px solid var(--border-active)',
              color: 'var(--text-secondary)', padding: '7px 18px', borderRadius: '6px',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.target.style.color = 'var(--text-primary)'; e.target.style.borderColor = 'var(--border-accent)'; }}
            onMouseLeave={e => { e.target.style.color = 'var(--text-secondary)'; e.target.style.borderColor = 'var(--border-active)'; }}
          >
            Log in
          </button>
          <button
            id="landing-signup-btn"
            onClick={() => navigate('/signup')}
            style={{
              background: 'var(--accent)', border: 'none',
              color: '#0d1117', padding: '7px 20px', borderRadius: '6px',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.target.style.opacity = '0.85'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ── TICKER STRIP ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 99,
        background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-subtle)',
        height: '34px', overflow: 'hidden', display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          display: 'flex', gap: '40px', padding: '0 20px',
          animation: 'tickerScroll 28s linear infinite',
          whiteSpace: 'nowrap',
        }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{t.sym}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'var(--text-primary)' }}>{t.val}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: t.chg.startsWith('+') ? 'var(--bull)' : 'var(--bear)' }}>{t.chg}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section id="hero" style={{
        minHeight: '100vh', paddingTop: '160px', paddingBottom: '80px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: '160px 32px 80px',
        position: 'relative',
      }}>
        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.25,
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)',
        }} />

        {/* Glowing orb */}
        <div style={{
          position: 'absolute', top: '40%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '780px' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            borderRadius: '20px', padding: '4px 14px 4px 10px',
            marginBottom: '28px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'arcPulse 2s infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Professional Market Intelligence
            </span>
          </div>

          <h1 style={{
            fontFamily: 'Inter', fontWeight: 800,
            fontSize: 'clamp(36px, 6vw, 72px)',
            lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}>
            Quant Intelligence<br />
            <span style={{
              background: 'linear-gradient(135deg, var(--accent), #60a5fa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              for Every Trader
            </span>
          </h1>

          <p style={{
            fontSize: '17px', lineHeight: 1.65,
            color: 'var(--text-secondary)', marginBottom: '40px',
            maxWidth: '560px', margin: '0 auto 40px',
          }}>
            AI-powered market analysis, real-time sentiment intelligence, and
            multi-timeframe quant signals — in a Bloomberg-grade terminal built for Indian markets.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              id="hero-get-started-btn"
              onClick={() => navigate('/signup')}
              style={{
                background: 'var(--accent)', border: 'none', color: '#0d1117',
                padding: '13px 32px', borderRadius: '8px', fontSize: '14px',
                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Get Started Free
              <Icon d={ICONS.arrow} size={16} />
            </button>
            <button
              id="hero-login-btn"
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent', border: '1px solid var(--border-active)',
                color: 'var(--text-primary)', padding: '13px 32px', borderRadius: '8px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.background = 'transparent'; }}
            >
              Sign In to Dashboard
            </button>
          </div>

          {/* Trust indicators */}
          <div style={{
            display: 'flex', gap: '32px', justifyContent: 'center',
            marginTop: '56px', flexWrap: 'wrap',
          }}>
            {[
              { label: 'Market Assets', value: '50+' },
              { label: 'News Sources', value: '50+' },
              { label: 'Update Frequency', value: '60s' },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '26px', fontWeight: 700, color: 'var(--accent)' }}>{value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '80px 32px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Capabilities</p>
          <h2 style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 'clamp(24px, 3.5vw, 40px)', marginBottom: '14px' }}>Everything the professional trader needs</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
            Built on institutional-grade frameworks, adapted for retail-accessible pricing.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
              borderRadius: '10px', padding: '24px',
              transition: 'border-color 0.2s, transform 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '8px',
                background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)', marginBottom: '16px',
              }}>
                <Icon d={ICONS[f.icon]} size={18} />
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '80px 32px', background: 'var(--bg-panel)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Workflow</p>
            <h2 style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 'clamp(24px, 3.5vw, 40px)' }}>How the platform works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{
                  fontFamily: 'JetBrains Mono', fontSize: '48px', fontWeight: 700,
                  color: 'var(--accent)', opacity: 0.15, lineHeight: 1, marginBottom: '12px',
                }}>{s.n}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>{s.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{s.desc}</p>
                {i < steps.length - 1 && (
                  <div style={{
                    position: 'absolute', top: '24px', right: '-16px',
                    color: 'var(--border-active)', display: 'none',
                  }}>
                    <Icon d={ICONS.arrow} size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ────────────────────────────────────────────── */}
      <section id="preview" style={{ padding: '80px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Terminal Preview</p>
          <h2 style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 'clamp(24px, 3.5vw, 40px)', marginBottom: '14px' }}>The intelligence platform in action</h2>
        </div>

        {/* Terminal mockup */}
        <div style={{
          background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
          borderRadius: '12px', overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}>
          {/* Window chrome */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'var(--bg-panel-alt)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f85149' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#d29922' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#34d399' }} />
            <span style={{ marginLeft: 8, fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>Quant Decision Engine — Terminal v2</span>
          </div>

          {/* Mock dashboard layout */}
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', minHeight: '320px' }}>
            {/* Index panel */}
            <div style={{ background: 'var(--bg-panel-alt)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Market Indices</div>
              {[
                { sym: 'NIFTY 50', val: '24,138', chg: '+0.42%', bull: true },
                { sym: 'BANKNIFTY', val: '51,892', chg: '+0.67%', bull: true },
                { sym: 'SENSEX', val: '79,441', chg: '+0.38%', bull: true },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.sym}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'var(--text-primary)' }}>{item.val}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'var(--bull)' }}>{item.chg}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quant signal panel */}
            <div style={{ background: 'var(--bg-panel-alt)', borderRadius: '8px', padding: '14px', border: '1px solid var(--accent-border)' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Quant Decision Engine</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <span style={{ background: 'var(--bull-dim)', border: '1px solid var(--bull-border)', color: 'var(--bull)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>BULLISH</span>
                <span style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>TRADE</span>
              </div>
              {[
                { label: 'Confidence', val: '78.4%' },
                { label: 'Alignment', val: '82.0%' },
                { label: 'Risk / Reward', val: '1 : 2.8' },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'var(--text-primary)' }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Sentiment panel */}
            <div style={{ background: 'var(--bg-panel-alt)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>News Sentiment</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '28px', fontWeight: 700, color: 'var(--bull)', marginBottom: '6px' }}>+0.42</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '12px' }}>Overall: BULLISH</div>
              <div style={{ height: '6px', background: 'linear-gradient(90deg, var(--bear), rgba(255,255,255,0.08), var(--bull))', borderRadius: '3px', position: 'relative', marginBottom: '8px' }}>
                <div style={{ position: 'absolute', top: '-2px', left: '62%', width: '10px', height: '10px', background: 'var(--bull)', borderRadius: '50%', border: '2px solid var(--bg-panel)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                <span style={{ color: 'var(--bull)' }}>Bull 58%</span>
                <span style={{ color: 'var(--text-muted)' }}>Neutral 24%</span>
                <span style={{ color: 'var(--bear)' }}>Bear 18%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section id="cta" style={{
        padding: '80px 32px', textAlign: 'center',
        background: 'var(--bg-panel)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            borderRadius: '20px', padding: '4px 14px 4px 10px', marginBottom: '24px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Free Access</span>
          </div>

          <h2 style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 'clamp(26px, 4vw, 44px)', marginBottom: '16px', lineHeight: 1.15 }}>
            Start trading smarter<br />
            <span style={{ color: 'var(--accent)' }}>today, for free.</span>
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '36px', lineHeight: 1.65 }}>
            Create your account in 30 seconds. No credit card required.
            Full platform access from day one.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              id="cta-signup-btn"
              onClick={() => navigate('/signup')}
              style={{
                background: 'var(--accent)', border: 'none', color: '#0d1117',
                padding: '14px 36px', borderRadius: '8px', fontSize: '15px',
                fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Create Free Account
            </button>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['No credit card', 'Full platform access', 'Cancel anytime'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <Icon d={ICONS.check} size={13} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ padding: '32px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 22, height: 22, background: 'var(--accent)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICONS.zap} size={12} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '13px' }}>Quant<span style={{ color: 'var(--accent)' }}>DE</span></span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          © 2026 Quant Decision Engine. For educational and research purposes only.
        </span>
        <div style={{ display: 'flex', gap: '20px' }}>
          {['Login', 'Sign Up', 'Dashboard', 'Telegram Signals'].map(link => (
            <button key={link}
              onClick={() => {
                if (link === 'Telegram Signals') {
                  navigate('/telegram-signals');
                } else {
                  navigate(link === 'Dashboard' ? '/dashboard' : `/${link.toLowerCase().replace(' ', '')}`);
                }
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >
              {link}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
