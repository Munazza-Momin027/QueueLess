import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  Layers,
  LayoutDashboard,
  CheckCircle2,
  BarChart2,
  User,
  LogOut,
  Monitor,
  Menu,
  X,
  Briefcase
} from 'lucide-react';

export const StaffLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Staff Operator Navigation Bar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(10, 15, 28, 0.90)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
        transition: 'all var(--transition-fast)'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px'
        }}>
          {/* Brand Logo & Staff Operator Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/staff/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(2, 132, 199, 0.4)',
                color: '#fff'
              }}>
                <Clock size={22} strokeWidth={2.4} />
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  letterSpacing: '-0.03em',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}>
                  Queue<span style={{ color: '#38bdf8' }}>Less</span>
                </div>
                <div style={{
                  fontSize: '0.62rem',
                  color: '#64748b',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginTop: '-3px'
                }}>
                  Counter Staff Terminal
                </div>
              </div>
            </Link>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <Briefcase size={13} /> Staff Operator
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Link
              to="/staff/dashboard"
              className={`nav-link ${isActive('/staff/dashboard') ? 'active' : ''}`}
              style={navLinkStyle(isActive('/staff/dashboard'))}
            >
              <LayoutDashboard size={16} /> Operator Desk
            </Link>
            <Link
              to="/staff/queue"
              className={`nav-link ${isActive('/staff/queue') ? 'active' : ''}`}
              style={navLinkStyle(isActive('/staff/queue'))}
            >
              <Layers size={16} /> Queue Controls
            </Link>
            <Link
              to="/staff/history"
              className={`nav-link ${isActive('/staff/history') ? 'active' : ''}`}
              style={navLinkStyle(isActive('/staff/history'))}
            >
              <CheckCircle2 size={16} /> Handled Tokens
            </Link>
            <Link
              to="/staff/stats"
              className={`nav-link ${isActive('/staff/stats') ? 'active' : ''}`}
              style={navLinkStyle(isActive('/staff/stats'))}
            >
              <BarChart2 size={16} /> Performance
            </Link>
            <Link
              to="/display"
              target="_blank"
              className="nav-link"
              style={{ ...navLinkStyle(false), color: '#38bdf8' }}
              title="Open Waiting Hall Public Kiosk"
            >
              <Monitor size={16} /> Hall Display
            </Link>
          </div>

          {/* Right Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Staff Profile Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-light)',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              color: '#fff'
            }}>
              <User size={15} color="#38bdf8" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name.split(' ')[0] || 'Staff'}
              </span>
              <span className="badge badge-serving" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                STAFF
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.4rem',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer'
              }}
              className="mobile-toggle"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-light)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <Link to="/staff/dashboard" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/staff/dashboard'))}>Operator Desk</Link>
            <Link to="/staff/queue" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/staff/queue'))}>Queue Controls</Link>
            <Link to="/staff/history" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/staff/history'))}>Handled Tokens</Link>
            <Link to="/staff/stats" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/staff/stats'))}>Performance Stats</Link>
            <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="btn btn-danger btn-sm" style={{ marginTop: '0.5rem' }}>
              Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* Main Page Content */}
      <main style={{ flex: 1 }}>
        {children || <Outlet />}
      </main>
    </div>
  );
};

function navLinkStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.88rem',
    fontWeight: 600,
    padding: '0.5rem 0.85rem',
    borderRadius: '8px',
    color: active ? '#ffffff' : '#94a3b8',
    background: active ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
    border: active ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
    transition: 'all 0.15s ease'
  };
}
