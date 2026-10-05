import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Shield, UserCheck, Briefcase, Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, demoLogin, getDashboardRoute } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resolveDestination = (userRole: string) => {
    const fromPath = (location.state as any)?.from?.pathname;
    if (fromPath && !fromPath.startsWith('/login') && fromPath !== '/') {
      // Validate role compatibility with target path
      if (fromPath.startsWith('/student') && userRole !== 'student' && userRole !== 'admin') {
        return getDashboardRoute(userRole);
      }
      if (fromPath.startsWith('/staff') && userRole !== 'staff' && userRole !== 'admin') {
        return getDashboardRoute(userRole);
      }
      if (fromPath.startsWith('/admin') && userRole !== 'admin') {
        return getDashboardRoute(userRole);
      }
      return fromPath;
    }
    return getDashboardRoute(userRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loggedUser = await login(email, password);
      const targetPath = resolveDestination(loggedUser.role);
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: 'student' | 'admin' | 'staff') => {
    setLoading(true);
    setError('');
    try {
      const loggedUser = await demoLogin(role);
      const targetPath = resolveDestination(loggedUser.role);
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem',
        border: '1px solid var(--border-light)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: '0 0 25px rgba(6, 182, 212, 0.4)'
          }}>
            <Clock size={24} />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '0.35rem' }}>Welcome Back</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Sign in to manage your campus tokens & appointments
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        {/* Demo 1-Click Quick Selectors */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8', fontWeight: 700, marginBottom: '0.5rem' }}>
            WEBNOVA 2026 1-Click Evaluation Logins:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => handleDemo('student')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '0.4rem 0.2rem' }}
            >
              <UserCheck size={12} /> Student
            </button>
            <button
              type="button"
              onClick={() => handleDemo('admin')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '0.4rem 0.2rem' }}
            >
              <Shield size={12} /> Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemo('staff')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '0.4rem 0.2rem' }}
            >
              <Briefcase size={12} /> Staff
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} /> Campus Email Address
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@queueless.edu"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#06b6d4', fontWeight: 600 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
