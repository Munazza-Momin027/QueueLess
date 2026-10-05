import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useQueueStream } from '../hooks/useQueueStream';
import { useSoundAlert } from '../hooks/useSoundAlert';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  SkipForward,
  Play,
  Users,
  Clock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const QueueManagementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialServiceId = searchParams.get('service_id');

  const { playChime, playDing } = useSoundAlert();
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number>(initialServiceId ? Number(initialServiceId) : 1);
  const [selectedCounterId, setSelectedCounterId] = useState<number>(1);
  const [deskData, setDeskData] = useState<any>(null);
  const [calling, setCalling] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const loadServicesList = async () => {
    try {
      const res = await api.getServices();
      setServices(res.services || []);
      if (!initialServiceId && res.services?.length > 0) {
        setSelectedServiceId(res.services[0].id);
      }
    } catch {}
  };

  const loadDeskData = async () => {
    if (!selectedServiceId) return;
    try {
      const res = await api.getStaffQueue(selectedServiceId);
      setDeskData(res);
      // Auto set counter if not yet set
      if (res.counters?.length > 0 && !res.counters.some((c: any) => c.id === selectedCounterId)) {
        setSelectedCounterId(res.counters[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadServicesList();
  }, []);

  useEffect(() => {
    loadDeskData();
  }, [selectedServiceId]);

  // Real-time synchronization
  useQueueStream(() => {
    loadDeskData();
  });

  const handleCallNext = async () => {
    setCalling(true);
    setActionMsg('');
    try {
      const res = await api.staffCallNext(selectedServiceId, selectedCounterId);
      playChime();
      setActionMsg(`Called token ${res.calledToken.token_number} to Counter!`);
      loadDeskData();
    } catch (err: any) {
      alert(err.message || 'No visitors currently waiting in line.');
    } finally {
      setCalling(false);
    }
  };

  const handleStatusTransition = async (tokenId: number, newStatus: string) => {
    try {
      await api.staffUpdateStatus(tokenId, newStatus, selectedCounterId);
      if (newStatus === 'completed') {
        playDing();
        confetti({ particleCount: 40, spread: 50 });
      }
      loadDeskData();
    } catch (err: any) {
      alert(err.message || 'Status transition failed.');
    }
  };

  const handleRecall = async (tokenId: number) => {
    try {
      await api.staffRecall(tokenId);
      playChime();
      alert('Token re-announced across lobby boards and user devices.');
    } catch (err: any) {
      alert(err.message || 'Recall failed.');
    }
  };

  const activeEntries = deskData?.activeEntries || [];
  const waitingEntries = activeEntries.filter((e: any) => e.status === 'waiting');
  const calledOrServing = activeEntries.filter((e: any) => e.status === 'called' || e.status === 'serving');
  const recentCompleted = deskData?.recentCompleted || [];
  const currentTimestamp = Date.now();

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem 1.5rem' }}>
      {/* Header & Service Selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            <Sparkles size={14} /> Counter Desk Station
          </div>
          <h1>Live Operator Desk</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
            Call waiting tokens, manage queue transitions, and dispatch audio announcements.
          </p>
        </div>

        {/* Desk Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Department Select */}
          <select
            className="form-select"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(Number(e.target.value))}
            style={{ width: 'auto', minWidth: '220px', fontWeight: 600 }}
          >
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

          {/* Counter Select */}
          <select
            className="form-select"
            value={selectedCounterId}
            onChange={(e) => setSelectedCounterId(Number(e.target.value))}
            style={{ width: 'auto', minWidth: '150px', fontWeight: 600 }}
          >
            {deskData?.counters?.map((c: any) => (
              <option key={c.id} value={c.id}>
                Counter {c.counter_number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> {actionMsg}
        </div>
      )}

      {/* Main Operator Command Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1.7fr)',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Left Column: Call Next Action & Current Token Card */}
        <div>
          {/* Primary CALL NEXT Button */}
          <div className="glass-card" style={{
            background: 'linear-gradient(145deg, rgba(16, 24, 40, 0.9) 0%, rgba(20, 30, 52, 0.8) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            boxShadow: '0 0 25px rgba(6, 182, 212, 0.15)',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '1.75rem'
          }}>
            <div style={{ fontSize: '0.78rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '0.5rem' }}>
              Station Ready Action
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1.25rem' }}>
              Counter {deskData?.counters?.find((c: any) => c.id === selectedCounterId)?.counter_number || '1'} Ready
            </h3>

            <button
              onClick={handleCallNext}
              disabled={calling || waitingEntries.length === 0}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                padding: '1.1rem',
                fontSize: '1.2rem',
                letterSpacing: '0.02em',
                boxShadow: '0 6px 25px rgba(6, 182, 212, 0.5)'
              }}
            >
              <Volume2 size={24} /> {calling ? 'Calling...' : `Call Next Token (${waitingEntries.length} Waiting)`}
            </button>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem' }}>
              Triggers lobby board announcement & mobile chime notification
            </div>
          </div>

          {/* Currently Called / Serving Cards */}
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Active at Desk ({calledOrServing.length})</h2>

            {calledOrServing.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                <Clock size={32} color="#64748b" style={{ margin: '0 auto 0.5rem auto' }} />
                <p style={{ fontSize: '0.88rem' }}>No token currently called or being served at this desk.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {calledOrServing.map((token: any) => (
                  <div key={token.id} className="glass-card" style={{
                    border: token.status === 'called' ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(6, 182, 212, 0.4)',
                    boxShadow: token.status === 'called' ? 'var(--glow-violet)' : 'var(--glow-cyan)',
                    padding: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '2rem',
                          fontWeight: 800,
                          color: '#fff',
                          lineHeight: '1'
                        }}>
                          {token.token_number}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600, marginTop: '0.35rem' }}>
                          {token.user_name} {token.student_id ? `(${token.student_id})` : ''}
                        </div>
                      </div>
                      <div>
                        {token.status === 'called' ? (
                          <span className="badge badge-called">Called to C{token.counter_number || '1'}</span>
                        ) : (
                          <span className="badge badge-serving">Serving at C{token.counter_number || '1'}</span>
                        )}
                      </div>
                    </div>

                    {token.notes && (
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.85rem', borderRadius: '6px', marginBottom: '1.25rem' }}>
                        Inquiry: {token.notes}
                      </div>
                    )}

                    {/* Operator Control Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                      {token.status === 'called' && (
                        <button
                          onClick={() => handleStatusTransition(token.id, 'serving')}
                          className="btn btn-primary btn-sm"
                        >
                          <Play size={13} /> Arrived (Serve)
                        </button>
                      )}

                      <button
                        onClick={() => handleStatusTransition(token.id, 'completed')}
                        className="btn btn-success btn-sm"
                      >
                        <CheckCircle2 size={13} /> Complete
                      </button>

                      <button
                        onClick={() => handleRecall(token.id)}
                        className="btn btn-secondary btn-sm"
                        title="Re-announce token chime"
                      >
                        <Volume2 size={13} /> Re-Call Chime
                      </button>

                      <button
                        onClick={() => handleStatusTransition(token.id, 'skipped')}
                        className="btn btn-danger btn-sm"
                      >
                        <SkipForward size={13} /> Skip / No Show
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Waiting Queue & History */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Waiting in Queue ({waitingEntries.length})</h2>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Sorted by priority & arrival</span>
          </div>

          <div className="glass-card" style={{ padding: '0.5rem', marginBottom: '2rem' }}>
            {waitingEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#94a3b8' }}>
                <Users size={32} color="#64748b" style={{ margin: '0 auto 0.5rem auto' }} />
                <p style={{ fontSize: '0.9rem' }}>Queue is currently empty. No waiting students.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {waitingEntries.map((entry: any, index: number) => (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderBottom: index < waitingEntries.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        #{index + 1}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
                            {entry.token_number}
                          </span>
                          {entry.priority > 0 && (
                            <span className="badge badge-called" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>Priority</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {entry.user_name} • Wait: {Math.max(1, Math.round((currentTimestamp - new Date(entry.joined_at).getTime()) / 60000))}m
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleStatusTransition(entry.id, 'called')}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      >
                        Call
                      </button>
                      <button
                        onClick={() => handleStatusTransition(entry.id, 'cancelled')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem', color: '#fda4af' }}
                        title="Cancel entry"
                      >
                        <XCircle size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Completed Log */}
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recently Completed / Skipped</h2>
            <div className="glass-card" style={{ padding: '0.75rem 1rem' }}>
              {recentCompleted.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                  No completed tokens logged today yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {recentCompleted.slice(0, 6).map((item: any) => (
                    <div key={item.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                      padding: '0.4rem 0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>{item.token_number}</span>
                        <span style={{ color: '#94a3b8' }}>{item.user_name}</span>
                      </div>
                      <span className={`badge ${item.status === 'completed' ? 'badge-completed' : 'badge-skipped'}`} style={{ fontSize: '0.68rem' }}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
