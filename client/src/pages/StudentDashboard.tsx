import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useQueueStream } from '../hooks/useQueueStream';
import { TokenCard } from '../components/TokenCard';
import {
  Layers,
  Calendar,
  Clock,
  PlusCircle,
  CheckCircle2,
  Sparkles,
  MapPin,
  FileText,
  Bell
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await api.getStudentDashboard();
      setData(res);
    } catch (err) {
      console.error('Student dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen for real-time queue shifts and token call events
  useQueueStream(() => {
    loadData();
  }, () => {
    loadData();
  });

  const handleCancelToken = async (tokenId: number) => {
    if (!window.confirm('Are you sure you want to cancel this ticket and leave the queue?')) return;
    try {
      await api.cancelToken(tokenId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel token.');
    }
  };

  const activeTokens = data?.activeTokens || [];
  const upcomingAppointments = data?.upcomingAppointments || [];
  const recentHistory = data?.recentHistory || [];

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            <Sparkles size={14} /> Student Portal Dashboard
          </div>
          <h1>Welcome, {user?.name?.split(' ')[0] || 'Student'} 👋</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            {user?.student_id ? `Student ID: ${user.student_id}` : 'Student Account'} • Real-time queue tickets & appointments
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/student/services" className="btn btn-primary">
            <PlusCircle size={18} /> Join a Queue
          </Link>
          <Link to="/student/appointments" className="btn btn-secondary">
            <Calendar size={18} /> Book Appointment
          </Link>
        </div>
      </div>

      {/* Futuristic Telemetry HUD Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2.5rem'
      }}>
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active Tokens</span>
            <span className="status-dot active"></span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>
            {activeTokens.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {activeTokens.length > 0 ? 'Live in-queue tracking enabled' : 'Ready to join queue'}
          </div>
        </div>

        <div className="cyber-card cyber-card-emerald" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Campus Counters</span>
            <span className="badge badge-completed" style={{ fontSize: '0.65rem' }}>Nominal</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
            Open
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            All campus counters active today
          </div>
        </div>

        <div className="cyber-card cyber-card-violet" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Appointments</span>
            <Calendar size={16} color="#c084fc" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#c084fc', marginTop: '0.25rem' }}>
            {upcomingAppointments.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Upcoming scheduled bookings
          </div>
        </div>
      </div>

      {/* Active Tokens Section */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.35rem' }}>Active Virtual Tickets</h2>
            <span className="badge badge-cyan">
              {activeTokens.length} Active
            </span>
          </div>
          {activeTokens.length > 0 && (
            <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
              Live Sync Active
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Loading your active queue tickets...
          </div>
        ) : activeTokens.length === 0 ? (
          <div className="cyber-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.1)',
              color: '#06b6d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <Clock size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Active Queue Tickets</h3>
            <p style={{ color: '#94a3b8', maxWidth: '440px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
              You are not currently waiting in any campus queue. Browse available services to secure your place in line remotely.
            </p>
            <Link to="/student/services" className="btn btn-primary btn-sm">
              <Layers size={16} /> Browse Campus Services
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem'
          }}>
            {activeTokens.map((t: any) => (
              <div key={t.id} className="cyber-card" style={{ padding: '1.75rem' }}>
                {/* Visual Pipeline Bar */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 700 }}>
                      Queue Journey
                    </span>
                    <span className={`badge badge-${t.status}`} style={{ fontSize: '0.68rem' }}>
                      {t.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: '#10b981' }} title="Issued" />
                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: t.status !== 'waiting' ? '#10b981' : 'linear-gradient(90deg, #10b981, #06b6d4)' }} title="Waiting" />
                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: ['called', 'serving', 'completed'].includes(t.status) ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)' }} title="Called" />
                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: ['serving', 'completed'].includes(t.status) ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)' }} title="Serving" />
                  </div>
                </div>

                <TokenCard token={t} showActions={true} onCancel={handleCancelToken} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Upcoming Appointments & Recent History */}
      <div className="grid-2" style={{ gap: '2rem' }}>
        {/* Upcoming Appointments */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={18} color="#06b6d4" /> Upcoming Appointments
            </h3>
            <Link to="/student/appointments" style={{ fontSize: '0.8rem', color: '#06b6d4' }}>View All</Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>
              No appointments scheduled.
              <div style={{ marginTop: '0.75rem' }}>
                <Link to="/student/appointments" className="btn btn-secondary btn-sm">
                  Schedule Now
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingAppointments.map((appt: any) => (
                <div key={appt.id} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{appt.service_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      <Clock size={13} /> {appt.appointment_date} at {appt.time_slot}
                    </div>
                    {appt.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                        <MapPin size={12} /> {appt.location}
                      </div>
                    )}
                  </div>
                  <span className="badge badge-cyan">{appt.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Past Visits */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={18} color="#10b981" /> Recent Queue History
            </h3>
            <Link to="/student/history" style={{ fontSize: '0.8rem', color: '#10b981' }}>Full History</Link>
          </div>

          {recentHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>
              No completed queue visits yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentHistory.map((item: any) => (
                <div key={item.id} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, color: '#38bdf8' }}>{item.token_number}</span>
                      <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>{item.service_name}</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                      {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : 'Recent'}
                      {item.counter_number ? ` • Counter ${item.counter_number}` : ''}
                    </div>
                  </div>
                  <span className={`badge badge-${item.status}`}>
                    {item.status}
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
