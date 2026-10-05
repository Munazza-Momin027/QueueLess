import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  LayoutDashboard,
  Users,
  Briefcase,
  Shield,
  Layers,
  BarChart3,
  Settings,
  User,
  LogOut,
  Monitor,
  Menu,
  X,
  Crown
} from 'lucide-react';

export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
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
      {/* Admin Executive Navigation Bar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(10, 15, 28, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(192, 132, 252, 0.3)',
        transition: 'all var(--transition-fast)'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px'
        }}>
          {/* Brand Logo & Administrator Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.45)',
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
                  Queue<span style={{ color: '#c084fc' }}>Less</span>
                </div>
                <div style={{
                  fontSize: '0.62rem',
                  color: '#94a3b8',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginTop: '-3px'
                }}>
                  Admin Operations Suite
                </div>
              </div>
            </Link>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(192, 132, 252, 0.12)',
              border: '1px solid rgba(192, 132, 252, 0.35)',
              color: '#c084fc',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <Crown size={13} /> Campus Admin
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Link
              to="/admin/dashboard"
              className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
              style={navLinkStyle(isActive('/admin/dashboard'))}
            >
              <LayoutDashboard size={15} /> Hub
            </Link>
            <Link
              to="/admin/students"
              className={`nav-link ${isActive('/admin/students') ? 'active' : ''}`}
              style={navLinkStyle(isActive('/admin/students'))}
            >
              <Users size={15} /> Students
            </Link>
            <Link
              to="/admin/staff"
              className={`nav-link ${isActive('/admin/staff') ? 'active' : ''}`}
              style={navLinkStyle(isActive('/admin/staff'))}
            >
              <Briefcase size={15} /> Staff
            </Link>
            <Link
              to="/admin/services"
              className={`nav-link ${isActive('/admin/services') ? 'active' : ''}`}
              style={navLinkStyle(isActive('/admin/services'))}
            >
              <Shield size={15} /> Services
            </Link>
            <Link
              to="/admin/queues"
              className={`nav-link ${isActive('/admin/queues') ? 'active' : ''}`}
              style={navLinkStyle(isActive('/admin/queues'))}
            >
              <Layers size={15} /> Queues
            </Link>
            <Link
              to="/admin/analytics"
              className={`nav-link ${isActive('/admin/analytics') ? 'active' : ''}`}
              style={navLinkStyle(isActive('/admin/analytics'))}
            >
              <BarChart3 size={15} /> Analytics
            </Link>
            <Link
              to="/admin/settings"
              className={`nav-link ${isActive('/admin/settings') ? 'active' : ''}`}
              style={navLinkStyle(isActive('/admin/settings'))}
            >
              <Settings size={15} /> Settings
            </Link>
            <Link
              to="/display"
              target="_blank"
              className="nav-link"
              style={{ ...navLinkStyle(false), color: '#38bdf8' }}
              title="Open Waiting Hall Public Kiosk Screen"
            >
              <Monitor size={15} /> Hall Screen
            </Link>
          </div>

          {/* Right Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Admin Profile Pill */}
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
              <User size={15} color="#c084fc" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name.split(' ')[0] || 'Admin'}
              </span>
              <span className="badge badge-called" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                ADMIN
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
            <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/admin/dashboard'))}>Admin Hub</Link>
            <Link to="/admin/students" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/admin/students'))}>Student Roster</Link>
            <Link to="/admin/staff" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/admin/staff'))}>Staff Management</Link>
            <Link to="/admin/services" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/admin/services'))}>Departments & Services</Link>
            <Link to="/admin/queues" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/admin/queues'))}>Queue Oversight</Link>
            <Link to="/admin/analytics" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/admin/analytics'))}>Analytics & AI Telemetry</Link>
            <Link to="/admin/settings" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle(isActive('/admin/settings'))}>System Settings</Link>
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
    gap: '0.35rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    padding: '0.45rem 0.75rem',
    borderRadius: '8px',
    color: active ? '#ffffff' : '#94a3b8',
    background: active ? 'rgba(192, 132, 252, 0.16)' : 'transparent',
    border: active ? '1px solid rgba(192, 132, 252, 0.35)' : '1px solid transparent',
    transition: 'all 0.15s ease'
  };
}
