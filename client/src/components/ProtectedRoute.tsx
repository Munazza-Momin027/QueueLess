import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type RoleType } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: (RoleType | 'user')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid rgba(6, 182, 212, 0.2)',
          borderTopColor: '#06b6d4',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Verifying secure session...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles) {
    const normalizedAllowed = allowedRoles.map(r => r === 'user' ? 'student' : r);
    const userRole = (user.role as string) === 'user' ? 'student' : user.role;
    if (!normalizedAllowed.includes(userRole)) {
      // Forbidden: Redirect to professional access denied page
      return (
        <Navigate
          to="/forbidden"
          state={{ attemptedPath: location.pathname, requiredRoles: normalizedAllowed, userRole }}
          replace
        />
      );
    }
  }

  return <>{children}</>;
};
