/**
 * ProtectedRoute.jsx — Guards dashboard routes from unauthenticated access.
 *
 * Usage in App.jsx:
 *   <Route path="/dashboard" element={<ProtectedRoute><DashboardApp /></ProtectedRoute>} />
 *
 * Behavior:
 *   - Authenticated: renders children normally
 *   - Not authenticated: redirects to /login (preserves the intended path)
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../../api/authService';

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    // Preserve the path the user tried to visit so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
