import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useQueueStream } from '../hooks/useQueueStream';
import { useSoundAlert } from '../hooks/useSoundAlert';
import { WaitEstimateBox } from '../components/WaitEstimateBox';
import { FeedbackModal } from '../components/FeedbackModal';
import {
  MapPin,
  CheckCircle2,
  Volume2,
  ChevronLeft,
  XCircle,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LiveQueueTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playChime, playDing } = useSoundAlert();

  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchToken = async () => {
    try {
      const res = await api.getTokenDetails(Number(id));
      const prevStatus = token?.status;
      setToken(res.token);

      if (res.token.status === 'called' && prevStatus !== 'called') {
        playChime();
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
      } else if (res.token.status === 'completed' && prevStatus !== 'completed') {
        playDing();
        setFeedbackOpen(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load live tracking telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
    const pollInterval = setInterval(fetchToken, 8000);
    return () => clearInterval(pollInterval);
  }, [id]);

  // Real-time SSE updates
  useQueueStream(
    () => {
      fetchToken();
    },
    (userAlert) => {
      if (userAlert.tokenId === Number(id) || userAlert.tokenNumber === token?.token_number) {
        playChime();
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
        fetchToken();
      }
    }
  );

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this token?')) return;
    setCancelling(true);
    try {
      await api.cancelToken(Number(id));
      alert('Token cancelled successfully.');
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel token.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
        Connecting to live campus queue telemetry stream...
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h3 style={{ color: '#fff', marginBottom: '1rem' }}>{error || 'Token not found.'}</h3>
        <Link to="/dashboard" className="btn btn-secondary">
          <ChevronLeft size={16} /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const isCalled = token.status === 'called';
  const isServing = token.status === 'serving';
  const isCompleted = token.status === 'completed';

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem', maxWidth: '720px' }}>
      {/* Top back navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <Link to={`/token/${token.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          <ChevronLeft size={16} /> View Pass
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={playChime}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
            title="Test audio alert chime"
          >
            <Volume2 size={13} /> Test Chime
          </button>
          <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
            Real-Time Stream
          </span>
        </div>
      </div>

      {/* URGENT CALLED ALERT BANNER */}
      {isCalled && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(99, 102, 241, 0.95) 100%)',
          border: '2px solid #a78bfa',
          boxShadow: '0 0 35px rgba(139, 92, 246, 0.6)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          color: '#ffffff',
          textAlign: 'center',
          marginBottom: '2rem',
          animation: 'pulse-ring 2s infinite'
        }}>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: '0.35rem' }}>
            🔊 Token Now Being Called!
          </div>
          <h2 style={{ fontSize: '2rem', color: '#fff', margin: '0.25rem 0' }}>
            Please Proceed to Counter {token.counter_number || '1'}
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#e0e7ff', marginTop: '0.35rem' }}>
            {token.counter_name || 'Desk'} • {token.location}
          </p>
        </div>
      )}

      {/* Main Status Panel */}
      <div className="glass-card" style={{ padding: '2.5rem 2rem', marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-cyan">{token.service_code}</span>
          <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{token.service_name}</span>
        </div>

        <div className="token-code" style={{ margin: '1rem 0' }}>
          {token.token_number}
        </div>

        <div style={{ marginBottom: '1.75rem' }}>
          {isCalled && <span className="badge badge-called" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>Called to Counter {token.counter_number}</span>}
          {isServing && <span className="badge badge-serving" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>Currently Serving at Counter {token.counter_number}</span>}
          {token.status === 'waiting' && <span className="badge badge-waiting" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>Waiting in Queue</span>}
          {isCompleted && <span className="badge badge-completed" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>Service Completed</span>}
        </div>

        {/* Big Live Position Counter */}
        {token.status === 'waiting' ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Current Position in Line
            </div>
            <div style={{
              fontSize: 'clamp(3rem, 7vw, 4.5rem)',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              color: '#38bdf8',
              lineHeight: '1.1',
              margin: '0.5rem 0'
            }}>
              #{token.people_ahead + 1}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              There {token.people_ahead === 1 ? 'is' : 'are'} <strong style={{ color: '#fff' }}>{token.people_ahead}</strong> {token.people_ahead === 1 ? 'person' : 'people'} ahead of you.
            </div>
          </div>
        ) : isServing ? (
          <div style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Currently Being Served</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Your inquiry is currently being processed at Counter {token.counter_number}.
            </p>
          </div>
        ) : isCompleted ? (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Visit Finished</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Thank you for using QueueLess. We hope you saved valuable campus time!
            </p>
            <button onClick={() => setFeedbackOpen(true)} className="btn btn-primary btn-sm">
              <Star size={14} /> Leave 10-Second Rating
            </button>
          </div>
        ) : null}

        {/* Detailed Wait Calculation Breakdown */}
        {token.status === 'waiting' && (
          <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <WaitEstimateBox
              estimatedMins={token.live_estimated_wait_mins}
              peopleAhead={token.people_ahead}
              activeCounters={token.active_counters_count || 1}
              explanation={token.wait_explanation}
              disclaimer={token.wait_disclaimer}
              factors={token.wait_factors}
            />
          </div>
        )}

        {/* Location prompt */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          <MapPin size={14} color="#06b6d4" />
          <span>Location: {token.location}</span>
        </div>
      </div>

      {/* Cancellation option */}
      {token.status === 'waiting' && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="btn btn-danger btn-sm"
          >
            <XCircle size={14} /> {cancelling ? 'Cancelling...' : 'Leave Queue / Cancel Ticket'}
          </button>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        queueEntryId={token.id}
        serviceId={token.service_id}
        serviceName={token.service_name}
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  );
};
