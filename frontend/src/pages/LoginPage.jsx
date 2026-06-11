/**
 * LoginPage.jsx — Email / Password authentication page.
 *
 * On success: redirects to the originally intended path (or /dashboard).
 * Design: Bloomberg Terminal dark aesthetic, single centered card.
 */
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { login } from '../api/authService';

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const EYE_OPEN  = "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
const EYE_SHUT  = "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22";
const ZAP       = "M13 2L3 14h9l-1 8 10-12h-9l1-8z";

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
        backgroundSize: '48px 48px', opacity: 0.18,
      }} />

      <div className="auth-card">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d1117' }}>
            <Icon d={ZAP} size={16} />
          </div>
          <span style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: '17px', letterSpacing: '0.01em' }}>
            Quant<span style={{ color: 'var(--accent)' }}>DE</span>
          </span>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
          Sign in to your account
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Create one free
          </Link>
        </p>

        {error && (
          <div style={{
            background: 'var(--bear-dim)', border: '1px solid var(--bear-border)',
            borderRadius: '6px', padding: '10px 14px', marginBottom: '20px',
            fontSize: '13px', color: 'var(--bear)', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Icon d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(p => !p)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: '2px', display: 'flex', alignItems: 'center',
                }}
              >
                <Icon d={showPwd ? EYE_SHUT : EYE_OPEN} size={16} />
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="auth-btn"
            disabled={loading || !email || !password}
            style={{ marginTop: '8px' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <span className="auth-spinner" />
                Authenticating…
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          By signing in you agree to use this platform for educational and research purposes only.
        </p>
      </div>
    </div>
  );
}
