import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { TokenCard } from '../components/TokenCard';
import { useQueueStream } from '../hooks/useQueueStream';
import {
  ChevronLeft,
  Printer,
  Activity,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export const DigitalTokenPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchToken = async () => {
    try {
      const res = await api.getTokenDetails(Number(id));
      setToken(res.token);
    } catch (err: any) {
      setError(err.message || 'Token not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, [id]);

  // Real-time synchronization
  useQueueStream(() => {
    fetchToken();
  }, (alertData) => {
    if (alertData.tokenId === Number(id)) {
      fetchToken();
    }
  });

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this token? You will lose your current spot in line.')) {
      return;
    }
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
        Retrieving digital token pass...
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

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem', maxWidth: '580px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>
        <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
          Live Pass Active
        </span>
      </div>

      {/* Main Holographic Token */}
      <TokenCard token={token} showActions={false} />

      {/* Action CTA Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        <Link to={`/track/${token.id}`} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
          <Activity size={18} /> Open Live Tracking Screen
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button onClick={() => window.print()} className="btn btn-secondary">
            <Printer size={16} /> Print Pass
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelling || ['completed', 'cancelled'].includes(token.status)}
            className="btn btn-danger"
          >
            <XCircle size={16} /> {cancelling ? 'Cancelling...' : 'Cancel Token'}
          </button>
        </div>
      </div>
    </div>
  );
};
