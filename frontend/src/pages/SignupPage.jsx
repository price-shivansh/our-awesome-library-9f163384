/**
 * SignupPage.jsx — New user registration page.
 *
 * Fields: Name, Email, Password, Confirm Password.
 * On success: auto-login → redirect to /dashboard.
 * Design: Bloomberg Terminal dark aesthetic.
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api/authService';

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const EYE_OPEN  = "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
const EYE_SHUT  = "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22";
const ZAP       = "M13 2L3 14h9l-1 8 10-12h-9l1-8z";
const CHECK     = "M20 6L9 17l-5-5";

function StrengthBar({ password }) {
  const score = !password ? 0
    : password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 4
    : password.length >= 10 && (/[A-Z]/.test(password) || /[0-9]/.test(password)) ? 3
    : password.length >= 6 ? 2
    : 1;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'var(--bear)', 'var(--warn)', '#60a5fa', 'var(--bull)'];

  if (!password) return null;
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1,2,3,4].map(n => (
          <div key={n} style={{ flex: 1, height: '3px', borderRadius: '2px', background: n <= score ? colors[score] : 'var(--border-subtle)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <span style={{ fontSize: '10px', color: colors[score] }}>{labels[score]}</span>
    </div>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [showCnf, setShowCnf]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const pwdMismatch = confirm.length > 0 && password !== confirm;
  const canSubmit   = name.trim() && email && password.length >= 6 && password === confirm && !loading;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await signup(name.trim(), email, password, confirm);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
          Create your account
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
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
          {/* Name */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              type="text"
              className="auth-input"
              placeholder="John Trader"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
              autoFocus
            />
          </div>

          {/* Email */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="signup-password"
                type={showPwd ? 'text' : 'password'}
                className="auth-input"
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{ paddingRight: '42px' }}
              />
              <button type="button" onClick={() => setShowPwd(p => !p)} style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '2px', display: 'flex', alignItems: 'center',
              }}>
                <Icon d={showPwd ? EYE_SHUT : EYE_OPEN} size={16} />
              </button>
            </div>
            <StrengthBar password={password} />
          </div>

          {/* Confirm Password */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-confirm">Confirm password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="signup-confirm"
                type={showCnf ? 'text' : 'password'}
                className={`auth-input ${pwdMismatch ? 'auth-input-error' : ''}`}
                placeholder="Repeat password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                style={{ paddingRight: '42px' }}
              />
              <button type="button" onClick={() => setShowCnf(p => !p)} style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '2px', display: 'flex', alignItems: 'center',
              }}>
                <Icon d={showCnf ? EYE_SHUT : EYE_OPEN} size={16} />
              </button>
            </div>
            {pwdMismatch && (
              <p style={{ fontSize: '11px', color: 'var(--bear)', marginTop: '4px' }}>Passwords do not match</p>
            )}
            {confirm && !pwdMismatch && (
              <p style={{ fontSize: '11px', color: 'var(--bull)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon d={CHECK} size={12} /> Passwords match
              </p>
            )}
          </div>

          <button
            id="signup-submit-btn"
            type="submit"
            className="auth-btn"
            disabled={!canSubmit}
            style={{ marginTop: '8px' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <span className="auth-spinner" />
                Creating account…
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          By creating an account you agree to use this platform for educational and research purposes only.
        </p>
      </div>
    </div>
  );
}
