import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { WaitEstimateBox } from '../components/WaitEstimateBox';
import {
  Layers,
  MapPin,
  Clock,
  ArrowRight,
  ChevronLeft,
  MessageSquare,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Trash2,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const JoinQueuePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, demoLogin } = useAuth();

  const [service, setService] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<any>(null);
  const [cancellingOld, setCancellingOld] = useState(false);

  useEffect(() => {
    // Wait until auth state is confirmed from localStorage/backend
    if (authLoading) return;

    if (!user) {
      navigate('/login', { state: { from: { pathname: location.pathname } } });
      return;
    }

    api.getService(Number(id))
      .then(res => setService(res.service))
      .catch(err => setError(err.message || 'Service not found.'))
      .finally(() => setLoading(false));
  }, [id, user, authLoading, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setActiveToken(null);

    try {
      const res = await api.joinQueue({
        service_id: Number(id),
        notes
      });

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Redirect immediately to Digital Token pass
      const targetTokenPath = user?.role === 'student' ? `/student/token/${res.token.id}` : `/token/${res.token.id}`;
      navigate(targetTokenPath);
    } catch (err: any) {
      const msg = err.message || 'Failed to join queue.';
      setError(msg);
      if (err.data?.activeToken) {
        setActiveToken(err.data.activeToken);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAndRejoin = async () => {
    if (!activeToken) return;
    setCancellingOld(true);
    try {
      await api.cancelToken(activeToken.id);
      setActiveToken(null);
      setError(null);

      // Instantly generate new token
      const res = await api.joinQueue({
        service_id: Number(id),
        notes
      });

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });

      const targetTokenPath = user?.role === 'student' ? `/student/token/${res.token.id}` : `/token/${res.token.id}`;
      navigate(targetTokenPath);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel existing ticket and rejoin.');
    } finally {
      setCancellingOld(false);
    }
  };

  const handleSwitchToStudent = async () => {
    try {
      await demoLogin('student');
      setError(null);
      setActiveToken(null);
    } catch (err: any) {
      setError(err.message || 'Failed to switch demo account.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid rgba(6, 182, 212, 0.2)',
          borderTopColor: '#06b6d4',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 1rem auto'
        }} />
        Loading service queue gateway...
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const backUrl = user?.role === 'student' ? `/student/services/${id}` : `/services/${id}`;
  const allServicesUrl = user?.role === 'student' ? '/student/services' : '/services';

  if (!service) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h3 style={{ color: '#fff', marginBottom: '1rem' }}>{error || 'Service not found.'}</h3>
        <Link to={allServicesUrl} className="btn btn-secondary">
          <ChevronLeft size={16} /> Back to Services
        </Link>
      </div>
    );
  }

  const isStaff = user?.role === 'staff';

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem', maxWidth: '680px' }}>
      <Link to={backUrl} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        <ChevronLeft size={16} /> Back to {service.name}
      </Link>

      <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
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
            <Layers size={24} />
          </div>
          <div style={{ fontSize: '0.8rem', color: '#06b6d4', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            Instant Virtual Token Pass
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{service.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            <MapPin size={14} color="#06b6d4" /> {service.location}
          </div>
        </div>

        {/* Staff Persona Alert */}
        {isStaff && (
          <div style={{
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            color: '#fef08a',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <AlertCircle size={18} color="#eab308" />
              Logged In as Staff Operator ({user.name})
            </div>
            <p style={{ fontSize: '0.84rem', margin: 0, color: '#fef9c3', lineHeight: 1.5 }}>
              Staff operator accounts manage counter desks and cannot hold student virtual queue passes. To test the student queuing experience, switch to the Student persona below.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleSwitchToStudent}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              >
                <UserCheck size={14} /> 1-Click Switch to Student Account
              </button>
              <Link to="/staff/dashboard" className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
                Open Operator Desk
              </Link>
            </div>
          </div>
        )}

        {/* Error / Conflict Notice */}
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
              <AlertCircle size={18} />
              {error}
            </div>

            {/* Active Token Quick Actions */}
            {activeToken && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                marginTop: '0.25rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                  Current active token number: <strong style={{ color: '#38bdf8' }}>{activeToken.token_number}</strong> ({activeToken.status})
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Link
                    to={user?.role === 'student' ? `/student/track/${activeToken.id}` : `/track/${activeToken.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                  >
                    <ExternalLink size={14} /> View Live Tracking Screen
                  </Link>
                  <button
                    type="button"
                    onClick={handleCancelAndRejoin}
                    disabled={cancellingOld}
                    className="btn btn-danger btn-sm"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                  >
                    {cancellingOld ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />}
                    {cancellingOld ? 'Resetting...' : 'Cancel Old & Get Fresh Token'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Wait Estimate */}
        <div style={{ marginBottom: '1.75rem' }}>
          <WaitEstimateBox
            estimatedMins={service.estimated_wait_mins}
            peopleAhead={service.waiting_count}
            activeCounters={service.counters?.filter((c: any) => c.is_active).length || 1}
            explanation={service.wait_explanation}
            disclaimer={service.wait_disclaimer}
            factors={service.wait_factors}
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MessageSquare size={14} /> Purpose of Visit / Specific Inquiry (Optional)
            </label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Official degree certificate verification, fee voucher submission..."
              rows={3}
              disabled={isStaff}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Helps counter staff prepare necessary documentation beforehand.
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting || service.is_paused || isStaff}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {submitting ? 'Generating Digital Token...' : 'Confirm & Generate Digital Token'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
