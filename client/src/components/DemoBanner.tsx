import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Shield, UserCheck, Briefcase } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSwitch = async (role: 'student' | 'staff' | 'admin') => {
    const loggedUser = await demoLogin(role);
    if (loggedUser.role === 'admin') navigate('/admin/dashboard');
    else if (loggedUser.role === 'staff') navigate('/staff/dashboard');
    else navigate('/student/dashboard');
  };

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(14, 22, 38, 0.98) 0%, rgba(20, 30, 52, 0.98) 100%)',
      borderBottom: '1px solid rgba(6, 182, 212, 0.25)',
      padding: '0.45rem 1rem',
      fontSize: '0.8rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '0.5rem',
      zIndex: 50,
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          background: 'rgba(6, 182, 212, 0.15)',
          color: '#38bdf8',
          padding: '0.15rem 0.5rem',
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '0.72rem'
        }}>
          <Sparkles size={12} /> RBAC MODULES
        </span>
        <span style={{ color: '#94a3b8' }}>
          Role-Based Access Control Mode: Switch instantly between Student, Staff, and Admin portals.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <span style={{ color: '#64748b', fontSize: '0.75rem', marginRight: '0.25rem' }}>Switch Role:</span>
        <button
          onClick={() => handleSwitch('student')}
          className="btn btn-sm"
          style={{
            background: user?.role === 'student' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
            borderColor: user?.role === 'student' ? 'var(--accent-emerald)' : 'transparent',
            color: user?.role === 'student' ? '#34d399' : '#cbd5e1',
            padding: '0.2rem 0.6rem',
            fontSize: '0.75rem'
          }}
          title="Login as student Alex Chen"
        >
          <UserCheck size={12} /> Student Portal
        </button>

        <button
          onClick={() => handleSwitch('staff')}
          className="btn btn-sm"
          style={{
            background: user?.role === 'staff' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
            borderColor: user?.role === 'staff' ? 'var(--accent-cyan)' : 'transparent',
            color: user?.role === 'staff' ? '#38bdf8' : '#cbd5e1',
            padding: '0.2rem 0.6rem',
            fontSize: '0.75rem'
          }}
          title="Login as Counter Officer Sarah"
        >
          <Briefcase size={12} /> Staff Desk
        </button>

        <button
          onClick={() => handleSwitch('admin')}
          className="btn btn-sm"
          style={{
            background: user?.role === 'admin' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
            borderColor: user?.role === 'admin' ? 'var(--accent-violet)' : 'transparent',
            color: user?.role === 'admin' ? '#c4b5fd' : '#cbd5e1',
            padding: '0.2rem 0.6rem',
            fontSize: '0.75rem'
          }}
          title="Login as Campus Admin Office"
        >
          <Shield size={12} /> Admin Hub
        </button>
      </div>
    </div>
  );
};
