import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  Smartphone,
  CheckCircle2,
  Users,
  Building,
  Sparkles,
  ChevronRight,
  Activity,
  Layers
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getServices()
      .then(res => setServices(res.services))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '5rem 0 4rem 0',
        overflow: 'hidden',
        textAlign: 'center'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: '#38bdf8',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1.75rem',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)'
          }}>
            <Sparkles size={16} /> Next-Gen Smart Campus Queue Engine • WEBNOVA 2026
          </div>

          {/* Heading */}
          <h1 style={{
            maxWidth: '900px',
            margin: '0 auto 1.5rem auto',
            fontWeight: 800,
            lineHeight: '1.15'
          }}>
            Never Wait in Line Again. <br />
            <span className="gradient-text">Zero Physical Queues. Total Transparency.</span>
          </h1>

          <p style={{
            maxWidth: '680px',
            margin: '0 auto 2.5rem auto',
            fontSize: '1.15rem',
            color: '#94a3b8',
            lineHeight: '1.6'
          }}>
            Join campus queues remotely from your smartphone or laptop. Receive a verified digital token, track real-time position updates, and arrive right when your counter is ready.
          </p>

          {/* Hero CTAs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '3.5rem'
          }}>
            <Link to="/services" className="btn btn-primary btn-lg">
              Explore Campus Services <ArrowRight size={18} />
            </Link>
            {user ? (
              <Link to="/dashboard" className="btn btn-secondary btn-lg">
                View My Active Tokens
              </Link>
            ) : (
              <button
                onClick={() => demoLogin('student')}
                className="btn btn-secondary btn-lg"
              >
                1-Click Student Demo
              </button>
            )}
            <Link to="/display" target="_blank" className="btn btn-violet btn-lg" title="Open Hall Big-Screen Kiosk">
              Waiting Hall Display
            </Link>
          </div>

          {/* Telemetry Highlights Banner */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            maxWidth: '960px',
            margin: '0 auto',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem',
            backdropFilter: 'blur(20px)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campus Time Saved</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8' }}>~42 mins</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Average per student visit</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wait Estimator</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>Dynamic AI</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Multi-counter load balancing</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Digital Token Passes</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#c084fc' }}>QR Verified</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Instant counter check-in</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lobby Congestion</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>-84%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Zero physical crowding</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Campus Services Grid */}
      <section style={{ padding: '3rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#06b6d4', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                Live Campus Telemetry
              </div>
              <h2>Active Services & Counters</h2>
            </div>
            <Link to="/services" className="btn btn-secondary btn-sm">
              View All Services <ChevronRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              Loading campus services...
            </div>
          ) : (
            <div className="grid-3">
              {services.slice(0, 3).map((service) => (
                <div key={service.id} className="glass-card glass-card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(6, 182, 212, 0.12)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: '#06b6d4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Layers size={22} />
                    </div>
                    <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                      {service.category}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: '#fff' }}>
                    {service.name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem', flex: 1, lineHeight: '1.5' }}>
                    {service.description}
                  </p>

                  {/* Telemetry pill */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Currently Waiting</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                        {service.waiting_count} {service.waiting_count === 1 ? 'student' : 'students'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Est. Wait Time</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>
                        ~{service.estimated_wait_mins} mins
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/services/${service.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                      Details
                    </Link>
                    <Link to={`/services/${service.id}/join`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                      Join Queue
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feature Pillars */}
      <section style={{ padding: '4rem 0', background: 'rgba(11, 18, 33, 0.4)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
            <div style={{ fontSize: '0.8rem', color: '#06b6d4', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              Architected for Campus Excellence
            </div>
            <h2>Why Colleges Choose QueueLess</h2>
          </div>

          <div className="grid-3">
            <div className="glass-card">
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#c4b5fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Smartphone size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Remote Digital Tokens</h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: '1.5' }}>
                Join queues from your hostel room, library desk, or cafeteria. Track live countdowns and arrive right as your token is announced.
              </p>
            </div>

            <div className="glass-card">
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Clock size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Dynamic Wait Estimations</h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: '1.5' }}>
                Never guess waiting times. Transparently calculated using active counter counts and real-time transaction durations.
              </p>
            </div>

            <div className="glass-card">
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#6ee7b7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Zap size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Instant Counter Chimes</h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: '1.5' }}>
                Receive immediate in-app audio chimes and visual prompts when your token is called to proceed to a designated counter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Step Flow */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem auto' }}>
            <div style={{ fontSize: '0.8rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              Simple 4-Step Process
            </div>
            <h2>How QueueLess Works</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            position: 'relative'
          }}>
            {[
              { step: '01', title: 'Select Service', desc: 'Browse available offices like Registrar, Accounts, Library, or Clinic.' },
              { step: '02', title: 'Get Digital Pass', desc: 'Join with 1 tap and get an instant holographic QR token pass.' },
              { step: '03', title: 'Live Tracking', desc: 'Watch people ahead reduce in real time with estimated wait telemetry.' },
              { step: '04', title: 'Proceed & Serve', desc: 'Get chime notification and walk directly to your designated counter.' }
            ].map((s, idx) => (
              <div key={idx} className="glass-card" style={{ position: 'relative' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: 'rgba(6, 182, 212, 0.2)',
                  lineHeight: '1',
                  marginBottom: '0.75rem'
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '0.4rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
