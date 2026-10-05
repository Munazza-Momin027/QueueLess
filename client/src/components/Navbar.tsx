import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Layers,
  Clock,
  Calendar,
  Bell,
  User,
  LogOut,
  Monitor,
  LayoutDashboard,
  FileText,
  Menu,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
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
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'rgba(10, 15, 28, 0.82)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'all var(--transition-fast)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
            color: '#fff'
          }}>
            <Clock size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.3rem',
              letterSpacing: '-0.03em',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}>
              Queue<span style={{ color: '#06b6d4' }}>Less</span>
            </div>
            <div style={{
              fontSize: '0.65rem',
              color: '#64748b',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginTop: '-3px'
            }}>
              Smart Virtual Queue
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="desktop-links" style={{
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          {user?.role === 'admin' ? (
            <>
              <Link to="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`} style={navLinkStyle(isActive('/admin/dashboard'))}>
                <LayoutDashboard size={16} /> Admin Hub
              </Link>
              <Link to="/admin/students" className={`nav-link ${isActive('/admin/students') ? 'active' : ''}`} style={navLinkStyle(isActive('/admin/students'))}>
                Students
              </Link>
              <Link to="/admin/staff" className={`nav-link ${isActive('/admin/staff') ? 'active' : ''}`} style={navLinkStyle(isActive('/admin/staff'))}>
                Staff
              </Link>
              <Link to="/admin/services" className={`nav-link ${isActive('/admin/services') ? 'active' : ''}`} style={navLinkStyle(isActive('/admin/services'))}>
                Services
              </Link>
              <Link to="/admin/analytics" className={`nav-link ${isActive('/admin/analytics') ? 'active' : ''}`} style={navLinkStyle(isActive('/admin/analytics'))}>
                Analytics
              </Link>
            </>
          ) : user?.role === 'staff' ? (
            <>
              <Link to="/staff/dashboard" className={`nav-link ${isActive('/staff/dashboard') ? 'active' : ''}`} style={navLinkStyle(isActive('/staff/dashboard'))}>
                <LayoutDashboard size={16} /> Operator Desk
              </Link>
              <Link to="/staff/queue" className={`nav-link ${isActive('/staff/queue') ? 'active' : ''}`} style={navLinkStyle(isActive('/staff/queue'))}>
                <Layers size={16} /> Queue Controls
              </Link>
              <Link to="/staff/history" className={`nav-link ${isActive('/staff/history') ? 'active' : ''}`} style={navLinkStyle(isActive('/staff/history'))}>
                Handled
              </Link>
            </>
          ) : user?.role === 'student' ? (
            <>
              <Link to="/student/dashboard" className={`nav-link ${isActive('/student/dashboard') ? 'active' : ''}`} style={navLinkStyle(isActive('/student/dashboard'))}>
                <LayoutDashboard size={16} /> My Tokens
              </Link>
              <Link to="/student/services" className={`nav-link ${isActive('/student/services') ? 'active' : ''}`} style={navLinkStyle(isActive('/student/services'))}>
                <Layers size={16} /> Services
              </Link>
              <Link to="/student/appointments" className={`nav-link ${isActive('/student/appointments') ? 'active' : ''}`} style={navLinkStyle(isActive('/student/appointments'))}>
                <Calendar size={16} /> Appointments
              </Link>
              <Link to="/student/history" className={`nav-link ${isActive('/student/history') ? 'active' : ''}`} style={navLinkStyle(isActive('/student/history'))}>
                <FileText size={16} /> History
              </Link>
            </>
          ) : (
            <>
              <Link to="/services" className={`nav-link ${isActive('/services') ? 'active' : ''}`} style={navLinkStyle(isActive('/services'))}>
                <Layers size={16} /> Services
              </Link>
            </>
          )}

          {/* Lobby Display Board */}
          <Link
            to="/display"
            target="_blank"
            className="nav-link"
            style={{ ...navLinkStyle(false), color: '#38bdf8' }}
            title="Open Waiting Hall Public Kiosk Screen"
          >
            <Monitor size={16} /> Hall Display
          </Link>
        </div>

        {/* Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <>
              {/* Notification Bell */}
              <Link
                to="/notifications"
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

              {/* User Profile Pill */}
              <Link
                to="/profile"
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
                <User size={15} color="#06b6d4" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name.split(' ')[0]}
                </span>
                <span className={`badge ${user.role === 'admin' ? 'badge-called' : user.role === 'staff' ? 'badge-serving' : 'badge-cyan'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                  {user.role}
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
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-light)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {user?.role === 'admin' || user?.role === 'staff' ? (
            <>
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/admin'))}>Admin Hub</Link>
              <Link to="/admin/queues" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/admin/queues'))}>Queue Desk</Link>
              <Link to="/admin/services" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/admin/services'))}>Services</Link>
              <Link to="/admin/analytics" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/admin/analytics'))}>Analytics</Link>
            </>
          ) : (
            <>
              <Link to="/services" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/services'))}>Browse Services</Link>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/dashboard'))}>My Active Tokens</Link>
              <Link to="/appointments" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/appointments'))}>Appointments</Link>
              <Link to="/history" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/history'))}>Queue History</Link>
            </>
          )}
          <Link to="/display" target="_blank" onClick={() => setMobileMenuOpen(false)} style={{ ...navLinkStyle(false), color: '#38bdf8' }}>Lobby Public Display</Link>
          {user && (
            <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="btn btn-danger btn-sm" style={{ marginTop: '0.5rem' }}>
              Sign Out
            </button>
          )}
        </div>
      )}

      {/* Inline styles for responsive visibility */}
      <style>{`
        @media (max-width: 860px) {
          .desktop-links { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
        @media (min-width: 861px) {
          .desktop-links { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </nav>
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
    background: active ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
    border: active ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
    transition: 'all 0.15s ease'
  };
}
