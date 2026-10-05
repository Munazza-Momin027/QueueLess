import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { WaitEstimateBox } from '../components/WaitEstimateBox';
import {
  Clock,
  MapPin,
  Users,
  Monitor,
  Calendar,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isStudentPortal = location.pathname.startsWith('/student');
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDetail = async () => {
    try {
      const res = await api.getService(Number(id));
      setService(res.service);
    } catch (err: any) {
      setError(err.message || 'Failed to load service details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
        Loading service profile and counter telemetry...
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h3 style={{ color: '#fff', marginBottom: '1rem' }}>{error || 'Service not found.'}</h3>
        <Link to="/services" className="btn btn-secondary">
          <ChevronLeft size={16} /> Return to Services
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Back button */}
      <Link to={isStudentPortal ? '/student/services' : '/services'} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        <ChevronLeft size={16} /> Back to Services Directory
      </Link>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr)',
        gap: '2.5rem',
        alignItems: 'start'
      }}>
        {/* Left Column: Details & Counters */}
        <div>
          {/* Service Banner */}
          <div className="glass-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                fontSize: '0.9rem',
                color: '#38bdf8',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-sm)'
              }}>
                {service.code}
              </span>
              <span className="badge badge-cyan">
                {service.category}
              </span>
              {service.is_paused ? (
                <span className="badge badge-waiting">Temporarily Paused</span>
              ) : (
                <span className="badge badge-completed">Queue Open</span>
              )}
            </div>

            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{service.name}</h1>
            <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {service.description}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Desk Location</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <MapPin size={14} color="#06b6d4" /> {service.location}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Operating Hours</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <Clock size={14} color="#a78bfa" /> {service.open_time} – {service.close_time}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Daily Capacity</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>
                  {service.daily_capacity} tokens / day
                </div>
              </div>
            </div>
          </div>

          {/* Active Counters Section */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Service Counters ({service.counters?.length || 0})</h2>
              <span style={{ fontSize: '0.8rem', color: '#10b981' }}>
                {service.counters?.filter((c: any) => c.is_active).length || 0} active now
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {service.counters?.map((counter: any) => (
                <div key={counter.id} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: counter.is_active ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: counter.is_active ? '#06b6d4' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)'
                    }}>
                      C{counter.counter_number}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                        {counter.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Assigned Officer: {counter.staff_name || 'Counter Staff'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {counter.is_active ? (
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Now Serving</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: counter.current_token ? '#38bdf8' : '#64748b', fontSize: '0.92rem' }}>
                          {counter.current_token || 'Available'}
                        </div>
                      </div>
                    ) : (
                      <span className="badge badge-cancelled" style={{ fontSize: '0.7rem' }}>Offline</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommended Visiting Hours */}
          {service.recommendations && (
            <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c4b5fd', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                <TrendingDown size={16} /> Optimal Visiting Time Recommendation
              </div>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '1rem', lineHeight: '1.5' }}>
                {service.recommendations.advice}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.6rem 0.85rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 600 }}>Low Wait Window</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{service.recommendations.optimalHours}</div>
                </div>
                <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', padding: '0.6rem 0.85rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#fda4af', fontWeight: 600 }}>Anticipated Peak Hours</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{service.recommendations.busyPeakHours}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Wait Telemetry & Quick Action Card */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: '#fff' }}>
              Current Queue Status
            </h3>

            {/* Wait Estimate Box Component */}
            <div style={{ marginBottom: '1.5rem' }}>
              <WaitEstimateBox
                estimatedMins={service.estimated_wait_mins}
                peopleAhead={service.waiting_count}
                activeCounters={service.counters?.filter((c: any) => c.is_active).length || 1}
                explanation={service.wait_explanation}
                disclaimer={service.wait_disclaimer}
                factors={service.wait_factors}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                to={isStudentPortal ? `/student/services/${service.id}/join` : `/services/${service.id}/join`}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={(e) => {
                  if (service.is_paused) {
                    e.preventDefault();
                    alert('Queue joining is temporarily paused.');
                  }
                }}
              >
                Join Virtual Queue <ArrowRight size={16} />
              </Link>

              <Link
                to={isStudentPortal ? `/student/appointments?service_id=${service.id}` : `/appointments?service_id=${service.id}`}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                <Calendar size={16} /> Book Scheduled Slot
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
