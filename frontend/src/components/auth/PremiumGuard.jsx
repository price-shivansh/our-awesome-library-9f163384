/**
 * PremiumGuard.jsx — Future Subscription Access Gate.
 *
 * Checks if the logged-in user is on a premium tier ("pro" or "elite").
 * Supports:
 *   1. "preview" fallback (default) — displays an inline "Coming Soon" card but lets the rest of the page render.
 *   2. "strict" fallback — blocks the wrapped component/page view entirely, showing a Premium Locked Screen.
 */
import React from 'react';
import { getStoredUser } from '../../api/authService';

export default function PremiumGuard({ children, fallbackMode = "preview" }) {
  const user = getStoredUser();
  const isPremium = user && (user.subscription_plan === 'pro' || user.subscription_plan === 'elite');

  if (isPremium) {
    return children;
  }

  if (fallbackMode === "preview") {
    return (
      <div style={{
        padding: '28px',
        border: '1px dashed var(--border-subtle)',
        borderRadius: '6px',
        textAlign: 'center',
        background: 'var(--bg-panel-alt)',
        color: 'var(--text-secondary)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        margin: '16px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span>🔒 PREMIUM FEATURE — ACTIVE SIGNAL STREAM</span>
        <span style={{ fontSize: '9px', opacity: 0.6 }}>[ LAUNCHING SOON FOR PRO / ELITE TIERS ]</span>
      </div>
    );
  }

  // Strict fallback mode (Premium Locked Screen)
  return (
    <div className="holo-panel" style={{
      maxWidth: '480px',
      margin: '40px auto',
      background: 'var(--bg-panel)',
      border: '1px solid var(--bear-border)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      borderRadius: '8px',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Top red header alert stripe */}
      <div style={{
        background: 'rgba(248,81,73,0.1)',
        padding: '8px 16px',
        borderBottom: '1px solid var(--bear-border)',
        fontSize: '9px',
        fontWeight: 700,
        color: 'var(--bear)',
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        textAlign: 'center'
      }}>
        🔒 RESTRICTED PORTAL
      </div>

      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🛡️</div>
        
        <h3 style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          marginBottom: '4px'
        }}>
          Premium Feature
        </h3>
        
        <h4 style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--accent)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginBottom: '16px'
        }}>
          Telegram Signal Network
        </h4>

        <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '24px'
        }}>
          Access to this real-time alert feed requires an active quantitative tier license. Complete your credentials setup below.
        </p>

        {/* Access options cards */}
        <div style={{
          background: 'var(--bg-panel-alt)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '16px 12px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '10px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '6px'
          }}>
            Required Access Plans
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>🟢 PRO Plan</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Signals & Daily Briefs</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>🔵 ELITE Plan</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Ultra-low Latency API</span>
            </div>
          </div>
        </div>

        <div style={{
          fontSize: '11px',
          fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--accent)',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          [ LAUNCHING SOON ]
        </div>
      </div>
    </div>
  );
}
