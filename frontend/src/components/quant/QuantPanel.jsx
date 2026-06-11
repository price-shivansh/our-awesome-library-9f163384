import React, { useState, useEffect } from 'react';
import { analyzeSymbolV3 } from '../../api/quantService';
import {
  TrendingUp, TrendingDown, Target, ShieldAlert, CheckCircle2, Activity, Newspaper, Info, AlertTriangle, AlertCircle
} from 'lucide-react';

const QuantPanel = ({ symbol, onApplyPlan }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    if (!symbol) return;
    
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await analyzeSymbolV3(symbol);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to fetch quant analysis');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    return () => { mounted = false; };
  }, [symbol]);

  if (!symbol) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-secondary)', fontFamily: 'Inter, sans-serif' }}>
        Select an asset to view Quant Intelligence
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontFamily: 'Inter, sans-serif', minHeight: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <span className="holo-text" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>[AI WORKSTATION] ANALYZING {symbol}…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px', background: 'var(--bg-panel)', border: '1px solid var(--bear-border)', borderRadius: '6px', fontFamily: 'Inter, sans-serif', color: 'var(--bear)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <AlertCircle size={18} style={{ shrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Analysis Offline</h4>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const bias = data.bias || 'Neutral';
  const tradeState = data.trade_state || 'WAIT';
  
  const getBiasColor = (b) => {
    switch (b.toLowerCase()) {
      case 'bullish': return 'var(--bull)';
      case 'bearish': return 'var(--bear)';
      default: return 'var(--warn)';
    }
  };

  const getBiasBg = (b) => {
    switch (b.toLowerCase()) {
      case 'bullish': return 'var(--bull-dim)';
      case 'bearish': return 'var(--bear-dim)';
      default: return 'var(--warn-dim)';
    }
  };

  const getBiasBorder = (b) => {
    switch (b.toLowerCase()) {
      case 'bullish': return 'var(--bull-border)';
      case 'bearish': return 'var(--bear-border)';
      default: return 'var(--warn-border)';
    }
  };

  const handleApply = () => {
    if (onApplyPlan && data.trade_outlook) {
      onApplyPlan({
        direction: bias.toUpperCase() === 'BEARISH' ? 'SELL' : 'BUY',
        stopLoss: data.trade_outlook.stop_loss || 0,
        target: data.trade_outlook.target_1 || 0,
        symbol: symbol
      });
    }
  };

  const tabs = ['Overview', 'Drivers', 'Risk & Regime'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Panel Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-panel-alt)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={13} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>QUANT DECISION ENGINE</span>
          <span style={{
            fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '3px',
            background: getBiasBg(bias), border: `1px solid ${getBiasBorder(bias)}`, color: getBiasColor(bias)
          }}>
            {bias.toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>STATE:</span>
          <span style={{
            fontSize: '9px', fontWeight: 700, padding: '1px 4px', borderRadius: '2px',
            background: tradeState === 'TRADE' ? 'var(--bull-dim)' : 'var(--warn-dim)',
            color: tradeState === 'TRADE' ? 'var(--bull)' : 'var(--warn)',
            border: `1px solid ${tradeState === 'TRADE' ? 'var(--bull-border)' : 'var(--warn-border)'}`
          }}>{tradeState}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--border-subtle)' }}>
        {tabs.map(tab => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '8px 12px', background: active ? 'var(--bg-panel)' : 'transparent',
                border: 'none', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '11px', fontWeight: active ? 600 : 500,
                cursor: 'pointer', transition: 'all 0.12s'
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
        
        {activeTab === 'Overview' && (
          <>
            {/* Section A: Market Bias */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Section A: Market Bias
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'var(--bg-panel-alt)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '8px 10px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Confidence Score</span>
                  <div className="holo-value" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent)', marginTop: '2px' }}>
                    {data.confidence?.total?.toFixed(1) || 0}%
                  </div>
                </div>
                <div style={{ background: 'var(--bg-panel-alt)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '8px 10px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Alignment Score</span>
                  <div className="holo-value" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent)', marginTop: '2px' }}>
                    {data.timeframes?.alignment_score?.toFixed(1) || 0}%
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginTop: '8px' }}>
                <div style={{ background: 'var(--bg-panel-alt)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '8px 10px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Market Regime &amp; Structure</span>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', textTransform: 'uppercase' }}>
                    {data.regime?.label?.replace('_', ' ') || 'UNKNOWN'}
                    {data.regime?.structure && <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginLeft: '6px' }}>({data.regime.structure})</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Section B: Trade Outlook */}
            {data.trade_outlook && (bias.toLowerCase() !== 'neutral') && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '8px' }}>
                  Section B: Trade Outlook
                </div>
                <div style={{ background: 'var(--bg-panel-alt)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Entry Zone</span>
                    <span className="holo-value" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {data.trade_outlook.entry_zone ? `${data.trade_outlook.entry_zone.min?.toFixed(2)} - ${data.trade_outlook.entry_zone.max?.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ background: 'rgba(248,81,73,0.05)', border: '1px solid var(--bear-border)', borderRadius: '3px', padding: '6px 8px' }}>
                      <span style={{ fontSize: '9px', color: 'var(--bear)' }}>Stop Loss</span>
                      <div className="holo-value" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {data.trade_outlook.stop_loss?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid var(--bull-border)', borderRadius: '3px', padding: '6px 8px' }}>
                      <span style={{ fontSize: '9px', color: 'var(--bull)' }}>Target 1</span>
                      <div className="holo-value" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {data.trade_outlook.target_1?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', fontSize: '10px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Target 2 (Extended)</span>
                    <span className="holo-value" style={{ color: 'var(--text-primary)' }}>{data.trade_outlook.target_2?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '10px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Risk / Reward Ratio</span>
                    <span className="holo-value" style={{ color: 'var(--warn)', fontWeight: 600 }}>1 : {data.trade_outlook.risk_reward_ratio || 'N/A'}</span>
                  </div>

                  <button
                    onClick={handleApply}
                    style={{
                      width: '100%', marginTop: '10px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                      color: 'var(--accent)', padding: '6px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '4px',
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(52, 211, 153, 0.20)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}
                  >
                    APPLY PLAN TO ORDER
                  </button>
                </div>
              </div>
            )}

            {/* Section D: AI Summary */}
            {data.explanation?.ai_summary && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  Section D: AI Summary
                </div>
                <div style={{ background: 'var(--bg-panel-alt)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '10px 12px', fontSize: '11px', lineHeight: 1.45, color: '#a78bfa' }}>
                  {data.explanation.ai_summary}
                </div>
              </div>
            )}
          </>
        )}

        {/* Drivers Tab */}
        {activeTab === 'Drivers' && (
          <>
            {/* Technical Drivers */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Technical Drivers
              </div>
              <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '11px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {data.explanation?.supporting_factors && data.explanation.supporting_factors.length > 0 ? (
                  data.explanation.supporting_factors.map((f, i) => <li key={i} style={{ marginBottom: '2px' }}>{f}</li>)
                ) : (
                  <li style={{ color: 'var(--text-muted)', listStyleType: 'none', marginLeft: '-14px' }}>No specific technical drivers.</li>
                )}
              </ul>
            </div>

            {/* News Drivers */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '6px' }}>
                News Drivers
              </div>
              <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '11px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {data.explanation?.news_drivers && data.explanation.news_drivers.length > 0 ? (
                  data.explanation.news_drivers.map((d, i) => <li key={i} style={{ marginBottom: '2px' }}>{d}</li>)
                ) : (
                  <li style={{ color: 'var(--text-muted)', listStyleType: 'none', marginLeft: '-14px' }}>No news drivers registered.</li>
                )}
              </ul>
            </div>

            {/* Risk Warnings */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Weakening Factors
              </div>
              <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '11px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {data.explanation?.weakening_factors && data.explanation.weakening_factors.length > 0 ? (
                  data.explanation.weakening_factors.map((w, i) => <li key={i} style={{ marginBottom: '2px' }}>{w}</li>)
                ) : (
                  <li style={{ color: 'var(--text-muted)', listStyleType: 'none', marginLeft: '-14px' }}>No significant weakening factors.</li>
                )}
              </ul>
            </div>
          </>
        )}

        {/* Risk & Regime Tab */}
        {activeTab === 'Risk & Regime' && (
          <>
            {/* Risk Events */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Risk Factors &amp; Events
              </div>
              {data.risk_events && data.risk_events.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {data.risk_events.map((e, idx) => (
                    <div key={idx} style={{ padding: '8px 10px', background: 'rgba(248,81,73,0.05)', border: '1px solid var(--bear-border)', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{e.event}</span>
                        <span style={{ fontSize: '8px', fontWeight: 700, padding: '1px 4px', borderRadius: '2px', background: 'var(--bear)', color: '#fff' }}>{e.impact} IMPACT</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{e.advisory}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>Time: {e.minutes_away} minutes away | Penalty: -{e.penalty} pts</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>No immediate risk events detected.</div>
              )}
            </div>

            {/* Regime Context */}
            {data.explanation?.regime_context && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  Regime Context &amp; Details
                </div>
                <div style={{ background: 'var(--bg-panel-alt)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '10px', fontSize: '11px', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                  {data.explanation.regime_context}
                </div>
              </div>
            )}

            {/* Invalidation Conditions */}
            {data.explanation?.invalidation_conditions && data.explanation.invalidation_conditions.length > 0 && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  Plan Invalidation Conditions
                </div>
                <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '11px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {data.explanation.invalidation_conditions.map((cond, i) => (
                    <li key={i}>{cond}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default QuantPanel;
