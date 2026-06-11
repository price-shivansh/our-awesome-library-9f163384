/**
 * TelegramSignalsPage.jsx — Dedicated Page for the Telegram Alerts Ecosystem.
 *
 * Designed to showcase bot commands, message mockups, and subscription models.
 * Follows Bloomberg/TradingView style rules with high information density.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, ArrowLeft, Send, CheckCircle, ShieldAlert } from 'lucide-react';
import PremiumGuard from '../components/auth/PremiumGuard';

const COMMANDS = [
  { cmd: '/start', desc: 'Initialize and authorize session with the Options Signal Engine.', exp: '/start <API_TOKEN>' },
  { cmd: '/help', desc: 'Show directory of active commands and parameters definitions.', exp: '/help' },
  { cmd: '/status', desc: 'Verify health of the database connection, websocket latency, and subscription info.', exp: '/status' },
  { cmd: '/news', desc: 'Fetch latest sentiment analysis briefing on a given ticker or asset category.', exp: '/news RELIANCE' },
  { cmd: '/signals', desc: 'Query active technical buy/sell triggers and confidence scores.', exp: '/signals BTC-USD' },
  { cmd: '/sentiment', desc: 'Get aggregated impact scores for global indices, forex, or energy sectors.', exp: '/sentiment commodities' },
  { cmd: '/watchlist', desc: 'Manage your active monitoring ticker lists.', exp: '/watchlist add NIFTY' },
  { cmd: '/subscribe', desc: 'Link your Telegram profile to a Pro/Elite billing license.', exp: '/subscribe pro_key_abc123' },
];

export default function TelegramSignalsPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── HEADER TOOLBAR ── */}
      <header style={{
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', height: '52px', gap: '16px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              padding: '6px 12px',
              cursor: 'pointer',
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-active)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            <ArrowLeft size={13} /> Return to Terminal
          </button>
          
          <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '22px', height: '22px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={11} style={{ color: 'var(--accent)', transform: 'rotate(-10deg)' }} />
            </div>
            <h1 className="holo-title" style={{ fontSize: '12px', letterSpacing: '0.05em', margin: 0, textTransform: 'uppercase' }}>
              Telegram Signals Page
            </h1>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '28px', flex: 1 }}>
        
        {/* ── 1. HERO SECTION ── */}
        <section style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'linear-gradient(180deg, var(--bg-panel) 0%, var(--bg-base) 100%)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent)'
          }} />
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: '20px', padding: '4px 12px', marginBottom: '16px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BOT NOTIFICATIONS</span>
          </div>

          <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.01em' }}>
            Telegram Signals Network
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 0', lineHeight: 1.6 }}>
            Receive real-time market intelligence, automated sentiment briefings, and technical signals directly through our secured Telegram channel.
          </p>
        </section>

        {/* ── 2. ABOUT THE BOT ── */}
        <section>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
            ■ Capabilities & Intelligence Channels
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {[
              { title: 'Breaking News Alerts', desc: 'Instant parsing of geopolitical and fiscal announcements with immediate classification tags.' },
              { title: 'AI Market Summaries', desc: 'Compact briefings distilling global market openings, correlations, and pre-trade session outlooks.' },
              { title: 'Sentiment Updates', desc: 'Updates on Crude Oil, Gold, Equities, and Cryptocurrencies derived from 50+ localized media outlets.' },
              { title: 'Trade Signals', desc: 'Quantitative alerts highlighting timeframe alignment triggers, targets, and exit zones.' },
              { title: 'Risk Alerts', desc: 'Live warnings on sudden volatility spikes, liquidity drops, and high risk-to-reward parameters.' },
              { title: 'Market Regime Changes', desc: 'Notifications on trend transitions, breakout confirmations, and range consolidations.' },
            ].map((item, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <CheckCircle size={14} style={{ color: 'var(--accent)', shrink: 0 }} />
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{item.title}</h3>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. COMMANDS SECTION ── */}
        <section>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
            ■ Active Bot Commands
          </div>
          
          <div className="holo-panel" style={{ background: 'var(--bg-panel)', padding: 0, overflow: 'hidden' }}>
            <table className="holo-table" style={{ width: '100%', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-panel-alt)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', width: '120px' }}>COMMAND</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>DESCRIPTION</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', width: '220px' }}>EXAMPLE USAGE</th>
                </tr>
              </thead>
              <tbody>
                {COMMANDS.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }}>{c.cmd}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{c.desc}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>{c.exp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 4 & 5. SIGNAL & AI SUMMARY EXAMPLES ── */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          
          {/* Signal Previews */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
              ■ Trade Signal Broadcast Preview
            </div>
            
            <div style={{
              background: '#151b26',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '260px'
            }}>
              {/* Telegram message header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={12} style={{ color: 'var(--accent)', transform: 'rotate(-10deg)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>QuantDE Signal Agent</div>
                  <div style={{ fontSize: '10px', color: '#6e7681' }}>bot</div>
                </div>
              </div>

              {/* Message content */}
              <div style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(0,238,255,0.1)',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                lineHeight: 1.6
              }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>⚡ QUANT ENGINE ALERT</span><br />
                <span style={{ color: 'var(--text-muted)' }}>SYMBOL:</span> <strong style={{ color: 'var(--text-primary)' }}>BTC-USD</strong><br />
                <span style={{ color: 'var(--text-muted)' }}>SIDE:</span> <strong style={{ color: 'var(--bull)' }}>BUY / LONG</strong><br />
                <span style={{ color: 'var(--text-muted)' }}>ENTRY RANGE:</span> 103,200 - 103,450<br />
                <span style={{ color: 'var(--text-muted)' }}>STOP LOSS:</span> 101,900<br />
                <span style={{ color: 'var(--text-muted)' }}>TARGET:</span> 106,800 (R:R 1 : 2.4)<br />
                <span style={{ color: 'var(--text-muted)' }}>CONFIDENCE SCORE:</span> <span style={{ color: 'var(--bull)' }}>84.2%</span><br />
                <span style={{ color: 'var(--text-muted)' }}>REGIME:</span> BULLISH BREAKOUT (15m/1H aligned)
              </div>
            </div>
          </div>

          {/* AI Summary Previews */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
              ■ AI Session Briefing Preview
            </div>
            
            <div style={{
              background: '#151b26',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '260px'
            }}>
              {/* Telegram message header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={12} style={{ color: 'var(--accent)', transform: 'rotate(-10deg)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>QuantDE Signal Agent</div>
                  <div style={{ fontSize: '10px', color: '#6e7681' }}>bot</div>
                </div>
              </div>

              {/* Message content */}
              <div style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(0,255,136,0.1)',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                lineHeight: 1.6
              }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>🤖 MORNING OUTLOOK DIGEST</span><br />
                <span style={{ color: 'var(--text-muted)' }}>REGIME DETECTED:</span> <strong style={{ color: 'var(--text-primary)' }}>CONSOLIDATION</strong><br />
                <span style={{ color: 'var(--text-muted)' }}>BIAS:</span> NEUTRAL-BULLISH (Indian Markets)<br />
                <span style={{ color: 'var(--text-muted)' }}>INDEX STATUS:</span><br />
                - NIFTY 50: 24,138.85 (<span style={{ color: 'var(--bull)' }}>+0.42%</span>)<br />
                - BANKNIFTY: 51,892.10 (<span style={{ color: 'var(--bull)' }}>+0.67%</span>)<br />
                <span style={{ color: 'var(--text-muted)' }}>SENTIMENT DRIVERS:</span><br />
                US Dollar Index eases to 104.2, fueling commodities indices relief. Gold consolidates. Brent crude remains bound inside 76-78 USD range. Watch for Nifty volume confirmation above 24,200 level.
              </div>
            </div>
          </div>

        </section>

        {/* ── PREMIUM ACCESS GATE DEMO ── */}
        <section style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Radio size={16} className="animate-pulse" style={{ color: 'var(--bear)' }} />
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              ■ Live Signal Channels (Premium Guard Gate)
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Demonstration 1: Preview Fallback (Coming Soon) */}
            <div className="holo-panel" style={{ background: 'var(--bg-panel)', padding: '20px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Mode A: Premium Inline Preview
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Free users can browse the surrounding info on this page. Below is the premium alerts widget utilizing preview mode.
              </p>
              
              <PremiumGuard fallbackMode="preview">
                <div style={{ padding: '12px', background: 'rgba(52,211,153,0.05)', border: '1px solid var(--bull-border)', color: 'var(--bull)', fontSize: '11px' }}>
                  🔓 ACTIVE PRO STREAM: Standard signals alerts are decrypted!
                </div>
              </PremiumGuard>
            </div>

            {/* Demonstration 2: Strict Fallback (Premium Locked Screen) */}
            <div className="holo-panel" style={{ background: 'var(--bg-panel)', padding: '20px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Mode B: Premium Block Access
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                This card demonstrates strict gating where the premium locked screen overlay blocks access completely.
              </p>
              
              <PremiumGuard fallbackMode="strict">
                <div style={{ padding: '12px', background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', fontSize: '11px' }}>
                  🔓 ACTIVE ELITE STREAM: Ultra-low latency webhook broadcast decrypted!
                </div>
              </PremiumGuard>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 16px', textAlign: 'center', background: 'var(--bg-panel)', marginTop: '24px' }}>
        <p className="holo-text" style={{ fontSize: '10px', margin: 0 }}>
          Quant Decision Terminal · Signals ecosystem mapped to active bot subscribers · Educational Simulator Only
        </p>
      </footer>

    </div>
  );
}
