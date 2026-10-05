import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useQueueStream } from '../hooks/useQueueStream';
import { useSoundAlert } from '../hooks/useSoundAlert';
import {
  Users,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Volume2,
  RefreshCw,
  Sparkles,
  UserCheck,
  Timer
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const StaffDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const { playChime, playDing } = useSoundAlert();

  const loadData = async () => {
    try {
      const res = await api.getStaffDashboard();
      setData(res);
    } catch (err) {
      console.error('Staff dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen for real-time queue changes
  useQueueStream(() => {
    loadData();
  });

  // Service timer for currently active consultation
  useEffect(() => {
    let interval: any;
    if (data?.currentServing?.status === 'serving') {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [data?.currentServing?.id, data?.currentServing?.status]);

  const handleCallNext = async () => {
    if (!data?.assignedCounter) return;
    setActionLoading(true);
    try {
      playChime();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      await api.staffCallNext(data.assignedCounter.service_id, data.assignedCounter.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'No more students currently waiting in queue.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'serving' | 'completed' | 'skipped') => {
    if (!data?.currentServing) return;
    setActionLoading(true);
    try {
      if (status === 'completed') playDing();
      await api.staffUpdateStatus(data.currentServing.id, status, data.assignedCounter.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update token status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecall = async () => {
    if (!data?.currentServing) return;
    try {
      playChime();
      await api.staffRecall(data.currentServing.id);
      alert(`Token ${data.currentServing.token_number} re-announced.`);
    } catch (err: any) {
      alert(err.message || 'Failed to recall token.');
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
        Loading staff operator desk...
      </div>
    );
  }

  const { assignedCounter, currentServing, waitingCount = 0, todayServed = 0, avgDurationMins = 8, upcomingStudents = [] } = data || {};

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Header and Desk Selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            <Sparkles size={14} /> Service Desk Operator Terminal
          </div>
          <h1>{assignedCounter ? assignedCounter.name : 'Counter Operator Terminal'}</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            {assignedCounter?.service_name || 'Campus Services'} • Location: {assignedCounter?.location || 'Central Lobby'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '0.4rem 0.9rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700,
            fontSize: '0.82rem'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
            Desk Online & Active
          </span>
          <button onClick={loadData} className="btn btn-secondary btn-sm" title="Refresh Telemetry">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Students Waiting Now
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: waitingCount > 5 ? '#f59e0b' : '#38bdf8' }}>
            {waitingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>In this service queue</div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Served Today
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#10b981' }}>
            {todayServed}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Successful consultations</div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Avg Turnaround Time
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#c084fc' }}>
            ~{avgDurationMins}m
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Benchmark: 10 mins</div>
        </div>
      </div>

      {/* Main Operator Section: Current Desk & Next in Line */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
        {/* Left: Active Desk Status Card */}
        <div>
          {currentServing ? (
            <div className="glass-card" style={{
              border: currentServing.status === 'called' ? '2px solid #8b5cf6' : '2px solid #06b6d4',
              boxShadow: currentServing.status === 'called' ? '0 0 35px rgba(139, 92, 246, 0.25)' : '0 0 30px rgba(6, 182, 212, 0.2)',
              padding: '2.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <span className={`badge badge-${currentServing.status}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
                  {currentServing.status === 'called' ? '📢 Student Called to Counter' : '⚡ Currently Serving'}
                </span>
                {currentServing.status === 'serving' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontWeight: 700, fontSize: '1.1rem' }}>
                    <Timer size={18} />
                    <span>{formatTimer(elapsedSeconds)}</span>
                  </div>
                )}
              </div>

              {/* Big Token Number */}
              <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Student Token Number
                </div>
                <div className="token-code" style={{ fontSize: '3.2rem', margin: '0.4rem 0' }}>
                  {currentServing.token_number}
                </div>
              </div>

              {/* Student Metadata Box */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Student Name:</span>
                  <span style={{ fontWeight: 700, color: '#ffffff' }}>{currentServing.student_name}</span>
                </div>
                {currentServing.student_id && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Student ID:</span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>{currentServing.student_id}</span>
                  </div>
                )}
                {currentServing.student_email && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Email:</span>
                    <span style={{ color: '#cbd5e1' }}>{currentServing.student_email}</span>
                  </div>
                )}
                {currentServing.notes && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Purpose / Notes:</div>
                    <div style={{ color: '#fff', fontSize: '0.9rem' }}>{currentServing.notes}</div>
                  </div>
                )}
              </div>

              {/* Counter Action Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentServing.status === 'called' ? (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => handleUpdateStatus('serving')}
                      disabled={actionLoading}
                      className="btn btn-primary"
                      style={{ flex: 2, padding: '0.9rem', fontSize: '1rem' }}
                    >
                      <UserCheck size={18} /> Student Arrived — Start Serving
                    </button>
                    <button
                      onClick={handleRecall}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.9rem' }}
                      title="Re-announce student token on hall screen and audio chime"
                    >
                      <Volume2 size={16} /> Re-Announce
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => handleUpdateStatus('completed')}
                      disabled={actionLoading}
                      className="btn btn-primary"
                      style={{ flex: 2, padding: '0.9rem', fontSize: '1rem', background: '#10b981' }}
                    >
                      <CheckCircle2 size={18} /> Complete Service
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('skipped')}
                      disabled={actionLoading}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.9rem', color: '#f87171' }}
                    >
                      <XCircle size={16} /> Mark No-Show
                    </button>
                  </div>
                )}

                {currentServing.status === 'called' && (
                  <button
                    onClick={() => handleUpdateStatus('skipped')}
                    disabled={actionLoading}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#94a3b8', marginTop: '0.25rem' }}
                  >
                    Student Did Not Arrive (Skip)
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Ready to Call State */
            <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.1)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto'
              }}>
                <PhoneCall size={32} />
              </div>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Desk Ready for Next Visitor</h2>
              <p style={{ color: '#94a3b8', maxWidth: '420px', margin: '0 auto 2rem auto', fontSize: '0.95rem' }}>
                {waitingCount > 0
                  ? `There are currently ${waitingCount} student${waitingCount === 1 ? '' : 's'} waiting in line. Click below to summon the next ticket.`
                  : 'All queues are currently clear for this department. New arrivals will appear automatically.'}
              </p>

              <button
                onClick={handleCallNext}
                disabled={actionLoading || waitingCount === 0}
                className="btn btn-primary"
                style={{
                  padding: '1.1rem 2.5rem',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  boxShadow: '0 0 30px rgba(6, 182, 212, 0.4)'
                }}
              >
                <PhoneCall size={20} /> Call Next Student ({waitingCount} in line)
              </button>
            </div>
          )}
        </div>

        {/* Right: Upcoming Queue Stream */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={18} color="#38bdf8" /> Upcoming In Line ({waitingCount})
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#10b981' }}>Live FIFO</span>
          </div>

          {upcomingStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>
              No students currently waiting.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {upcomingStudents.map((st: any, idx: number) => (
                <div key={st.id} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: idx === 0 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: idx === 0 ? '#38bdf8' : '#94a3b8',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem' }}>
                        {st.token_number}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                        {st.student_name} {st.student_id ? `(${st.student_id})` : ''}
                      </div>
                      {st.notes && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                          {st.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="badge badge-waiting" style={{ fontSize: '0.72rem' }}>
                    Waiting
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
