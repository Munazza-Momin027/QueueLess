import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Clock,
  Layers,
  LayoutDashboard,
  Calendar,
  FileText,
  Bell,
  User,
  LogOut,
  Monitor,
  Menu,
  X,
  GraduationCap
} from 'lucide-react';

export const StudentLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchUnread = async () => {
    if (user) {
      try {
        const res = await api.getNotifications();
        setUnreadCount(res.unreadCount);
      } catch {
        // Silent fail
      }
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Student Portal Navigation Bar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(10, 15, 28, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
        transition: 'all var(--transition-fast)'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px'
        }}>
          {/* Brand Logo & Student Portal Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/student/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)',
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
                  Queue<span style={{ color: '#10b981' }}>Less</span>
                </div>
                <div style={{
                  fontSize: '0.62rem',
                  color: '#64748b',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginTop: '-3px'
                }}>
                  Smart Campus Queue
                </div>
              </div>
            </Link>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <GraduationCap size={13} /> Student Portal
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Link
              to="/student/dashboard"
              className={`nav-link ${isActive('/student/dashboard') ? 'active' : ''}`}
              style={navLinkStyle(isActive('/student/dashboard'))}
            >
              <LayoutDashboard size={16} /> My Tokens
            </Link>
            <Link
              to="/student/services"
              className={`nav-link ${isActive('/student/services') ? 'active' : ''}`}
              style={navLinkStyle(isActive('/student/services'))}
            >
              <Layers size={16} /> Services
            </Link>
            <Link
              to="/student/appointments"
              className={`nav-link ${isActive('/student/appointments') ? 'active' : ''}`}
              style={navLinkStyle(isActive('/student/appointments'))}
            >
              <Calendar size={16} /> Appointments
            </Link>
            <Link
              to="/student/history"
              className={`nav-link ${isActive('/student/history') ? 'active' : ''}`}
              style={navLinkStyle(isActive('/student/history'))}
            >
              <FileText size={16} /> History
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
            {/* Notification Bell */}
            <Link
              to="/student/notifications"
              style={{
                position: 'relative',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#cbd5e1'
              }}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Student Profile Pill */}
            <Link
              to="/student/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-light)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                color: '#fff',
                textDecoration: 'none'
              }}
            >
              <User size={15} color="#10b981" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name.split(' ')[0] || 'Student'}
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                {user?.student_id || 'STUDENT'}
              </span>
            </Link>

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
            <Link to="/student/dashboard" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/student/dashboard'))}>My Active Tokens</Link>
            <Link to="/student/services" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/student/services'))}>Browse Services</Link>
            <Link to="/student/appointments" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/student/appointments'))}>Appointments</Link>
            <Link to="/student/history" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/student/history'))}>Queue History</Link>
            <Link to="/student/notifications" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/student/notifications'))}>Notifications ({unreadCount})</Link>
            <Link to="/student/profile" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/student/profile'))}>Profile Settings</Link>
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
    background: active ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
    border: active ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
    transition: 'all 0.15s ease'
  };
}
