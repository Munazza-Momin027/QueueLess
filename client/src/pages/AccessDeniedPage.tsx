import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut, Home, KeyRound } from 'lucide-react';

export const AccessDeniedPage: React.FC = () => {
  const { user, logout, getDashboardRoute } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state as any) || {};
  const attemptedPath = state.attemptedPath || location.pathname;
  const userRole = (user?.role || state.userRole || 'visitor').toUpperCase();
  const requiredRoles = state.requiredRoles ? state.requiredRoles.map((r: string) => r.toUpperCase()).join(' or ') : 'Privileged Personnel';

  const dashboardPath = user ? getDashboardRoute(user.role) : '/login';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container" style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem'
    }}>
      <div className="glass-card" style={{
        maxWidth: '560px',
        width: '100%',
        textAlign: 'center',
        padding: '3rem 2rem',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        boxShadow: '0 0 40px rgba(239, 68, 68, 0.12)'
      }}>
        {/* Shield Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '2px solid rgba(239, 68, 68, 0.4)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto',
          boxShadow: '0 0 25px rgba(239, 68, 68, 0.25)'
        }}>
          <ShieldAlert size={36} />
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          padding: '0.3rem 0.8rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '1rem'
        }}>
          <KeyRound size={13} /> 403 Forbidden — Broken Access Control Prevention
        </div>

        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.75rem', color: '#ffffff' }}>
          Access Restricted
        </h1>

        <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
          You do not have permission to view <code style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '0.2rem 0.45rem', borderRadius: '4px', color: '#f87171' }}>{attemptedPath}</code>.
          This module is strictly isolated to <strong>{requiredRoles}</strong> accounts under QueueLess Role-Based Access Control (RBAC).
        </p>

        {/* Telemetry metadata card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          textAlign: 'left',
          fontSize: '0.84rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ color: '#64748b' }}>Your Account Role:</span>
            <span style={{
              fontWeight: 700,
              color: userRole === 'ADMIN' ? '#c084fc' : userRole === 'STAFF' ? '#38bdf8' : '#34d399'
            }}>
              {userRole}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ color: '#64748b' }}>Required Authorization:</span>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>{requiredRoles}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Enforcement:</span>
            <span style={{ color: '#94a3b8' }}>Cryptographic Backend JWT & DB Validation</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={dashboardPath} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Home size={16} /> Return to Your {userRole} Dashboard
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={16} /> Switch Account
          </button>
        </div>
      </div>
    </div>
  );
};
