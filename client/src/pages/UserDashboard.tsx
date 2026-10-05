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
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTokens, setActiveTokens] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [tokensRes, apptRes] = await Promise.all([
        api.getMyActiveTokens(),
        api.getMyAppointments()
      ]);
      setActiveTokens(tokensRes.activeTokens || []);
      setAppointments(apptRes.appointments || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
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

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            <Sparkles size={14} /> Student Portal Dashboard
          </div>
          <h1>Hello, {user?.name || 'Visitor'} 👋</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Track your real-time virtual queue tickets and campus appointments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/services" className="btn btn-primary">
            <PlusCircle size={18} /> Join a Queue
          </Link>
          <Link to="/appointments" className="btn btn-secondary">
            <Calendar size={18} /> Book Appointment
          </Link>
        </div>
      </div>

      {/* Active Tokens Section */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.35rem' }}>Active Virtual Tokens</h2>
            <span className="badge badge-cyan">
              {activeTokens.length} Active
            </span>
          </div>
          {activeTokens.length > 0 && (
            <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
              Live Sync Enabled
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Loading your active queue telemetry...
          </div>
        ) : activeTokens.length === 0 ? (
          <div className="glass-card" style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            border: '1px dashed var(--border-light)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.1)',
              color: '#06b6d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <Layers size={26} />
            </div>
            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Active Queues</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              You are not waiting in any virtual line. Select a campus department to generate a digital token without waiting physically.
            </p>
            <Link to="/services" className="btn btn-primary btn-sm">
              Browse Available Services <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid-2" style={{ gap: '1.5rem' }}>
            {activeTokens.map((token) => (
              <TokenCard key={token.id} token={token} />
            ))}
          </div>
        )}
      </div>

      {/* Two Column Grid: Appointments & Quick Services */}
      <div className="grid-2" style={{ gap: '2rem' }}>
        {/* Scheduled Appointments */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Scheduled Appointments</h2>
            <Link to="/appointments" style={{ fontSize: '0.82rem', color: '#38bdf8' }}>Manage</Link>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            {appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.75rem 1rem', color: '#94a3b8', fontSize: '0.88rem' }}>
                No scheduled appointments found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {appointments.slice(0, 3).map((appt) => (
                  <div key={appt.id} style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                        {appt.service_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <Clock size={12} /> {appt.appointment_date} at {appt.time_slot}
                      </div>
                    </div>
                    <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>
                      {appt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Tools & Public Display Kiosk Banner */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Campus Display & Tools</h2>
          <div className="glass-card" style={{
            background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.9) 0%, rgba(22, 34, 58, 0.8) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            padding: '1.5rem',
            position: 'relative'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#c4b5fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Sparkles size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '0.4rem' }}>
              Public Waiting Hall Screen
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5', marginBottom: '1.25rem' }}>
              Want to see what's on the main lobby display board? Launch the full-screen kiosk board to view current called tokens and audio announcement cues.
            </p>
            <Link to="/display" target="_blank" className="btn btn-violet btn-sm">
              Launch Waiting Hall Display <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
