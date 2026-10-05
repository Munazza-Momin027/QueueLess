import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FeedbackModal } from '../components/FeedbackModal';
import {
  FileText,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Star,
  Sparkles,
  Layers
} from 'lucide-react';

export const QueueHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const loadHistory = async () => {
    try {
      const res = (user?.role === 'staff' || user?.role === 'admin')
        ? await api.getStaffHistory()
        : await api.getStudentHistory().catch(() => api.getQueueHistory());
      setHistory(res.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const openRating = (entry: any) => {
    setSelectedEntry(entry);
    setFeedbackOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-completed">Completed</span>;
      case 'cancelled':
        return <span className="badge badge-cancelled">Cancelled</span>;
      case 'skipped':
        return <span className="badge badge-skipped">Skipped</span>;
      default:
        return <span className="badge badge-waiting">{status}</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      <div style={{ maxWidth: '840px', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
          <Sparkles size={14} /> Historical Telemetry
        </div>
        <h1>Queue History & Activity Log</h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.5rem' }}>
          Review your previous service visits, handling durations, and satisfaction ratings.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          Loading your visit log...
        </div>
      ) : history.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
          <FileText size={40} color="#64748b" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Historical Entries</h3>
          <p style={{ fontSize: '0.9rem' }}>You have not completed any virtual queue visits yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.map((entry) => (
            <div key={entry.id} className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: '#38bdf8',
                      fontSize: '1.15rem'
                    }}>
                      {entry.token_number}
                    </span>
                    {getStatusBadge(entry.status)}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>{entry.service_name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                    <MapPin size={13} color="#06b6d4" /> {entry.location}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Date Joined</div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                    {new Date(entry.joined_at).toLocaleDateString()} at {new Date(entry.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {entry.counter_number && (
                    <div style={{ fontSize: '0.78rem', color: '#c4b5fd', marginTop: '0.2rem' }}>
                      Counter {entry.counter_number}
                    </div>
                  )}
                </div>
              </div>

              {/* Service notes if any */}
              {entry.notes && (
                <div style={{ fontSize: '0.84rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.85rem', borderRadius: '6px', marginBottom: '1rem' }}>
                  Inquiry: {entry.notes}
                </div>
              )}

              {/* Feedback status row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  {entry.user_rating ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f59e0b', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex' }}>
                        {[...Array(entry.user_rating)].map((_, i) => (
                          <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                        ))}
                      </div>
                      <span style={{ color: '#cbd5e1', fontSize: '0.8rem', marginLeft: '0.3rem' }}>
                        "{entry.user_comments || 'Rated'}"
                      </span>
                    </div>
                  ) : entry.status === 'completed' ? (
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No feedback provided yet.</span>
                  ) : null}
                </div>

                {entry.status === 'completed' && !entry.user_rating && (
                  <button onClick={() => openRating(entry)} className="btn btn-secondary btn-sm">
                    <Star size={13} color="#f59e0b" /> Rate Experience
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEntry && (
        <FeedbackModal
          queueEntryId={selectedEntry.id}
          serviceId={selectedEntry.service_id}
          serviceName={selectedEntry.service_name}
          isOpen={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          onSuccess={() => loadHistory()}
        />
      )}
    </div>
  );
};
