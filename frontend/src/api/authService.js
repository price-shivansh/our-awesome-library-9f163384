/**
 * authService.js — Authentication API client + session helpers.
 *
 * Handles all interactions with /api/auth/* and manages the JWT token
 * stored in localStorage. Import these functions wherever auth is needed.
 */

const getApiBase = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return '';
  return url.replace(/\/$/, '');
};
const API_BASE = getApiBase();

const TOKEN_KEY = "qde_token";
const USER_KEY  = "qde_user";

// ── Storage helpers ────────────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}

function _storeSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── API calls ──────────────────────────────────────────────────────────────────

/**
 * Sign up a new user. On success, stores token + user and returns them.
 */
export async function signup(name, email, password, confirmPassword) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email,
      password,
      confirm_password: confirmPassword,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Signup failed");
  }

  _storeSession(data.access_token, data.user);
  return data;
}

/**
 * Log in an existing user. On success, stores token + user and returns them.
 */
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Login failed");
  }

  _storeSession(data.access_token, data.user);
  return data;
}

/**
 * Validate the stored token against /api/auth/me.
 * Returns user data if valid, null if token is expired/missing.
 */
export async function fetchMe() {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      logout(); // token expired / invalid
      return null;
    }
    const user = await res.json();
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
}

/**
 * Return Authorization headers object for authenticated requests.
 */
export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
