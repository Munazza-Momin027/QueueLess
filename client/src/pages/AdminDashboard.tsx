import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useQueueStream } from '../hooks/useQueueStream';
import {
  Layers,
  Users,
  Clock,
  Monitor,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Shield,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      const res = await api.getAdminOverview();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  useQueueStream(() => {
    loadMetrics();
  });

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
        Loading administrative telemetry...
      </div>
    );
  }

  const { metrics, services = [] } = data || {};

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            <Sparkles size={14} /> Operational Command Center
          </div>
          <h1>Admin & Operator Hub</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Campus-wide virtual queue monitoring, desk controls, and performance metrics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/admin/queues" className="btn btn-primary">
            <Layers size={18} /> Open Queue Desk
          </Link>
          <Link to="/admin/services" className="btn btn-secondary">
            <Shield size={18} /> Service Manager
          </Link>
          <Link to="/display" target="_blank" className="btn btn-violet">
            <Monitor size={18} /> Lobby Screen <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <div className="cyber-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
            <span style={{ letterSpacing: '0.05em', fontWeight: 700 }}>WAITING IN LINE</span>
            <Users size={16} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fbbf24', lineHeight: '1.1', fontFamily: 'var(--font-mono)' }}>
            {metrics?.totalWaitingNow || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            Across all campus services
          </div>
        </div>

        <div className="cyber-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
            <span style={{ letterSpacing: '0.05em', fontWeight: 700 }}>BEING SERVED</span>
            <Clock size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#38bdf8', lineHeight: '1.1', fontFamily: 'var(--font-mono)' }}>
            {metrics?.totalServingNow || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            Active at counter desks
          </div>
        </div>

        <div className="cyber-card cyber-card-emerald">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
            <span style={{ letterSpacing: '0.05em', fontWeight: 700 }}>COMPLETED TODAY</span>
            <CheckCircle2 size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#10b981', lineHeight: '1.1', fontFamily: 'var(--font-mono)' }}>
            {metrics?.totalServedToday || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            Total tickets resolved
          </div>
        </div>

        <div className="cyber-card cyber-card-violet">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
            <span style={{ letterSpacing: '0.05em', fontWeight: 700 }}>AVG WAIT TIME</span>
            <TrendingUp size={16} color="#c084fc" />
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#c084fc', lineHeight: '1.1', fontFamily: 'var(--font-mono)' }}>
            ~{metrics?.avgWaitMins || 7}m
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            Average queue duration
          </div>
        </div>
      </div>

      {/* Live Services Desk Roster Table */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem' }}>Campus Service Desks</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Live queue lengths and active counter allocation per department</p>
          </div>
          <Link to="/admin/analytics" className="btn btn-secondary btn-sm">
            <BarChart3 size={15} /> Deep Analytics
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Service & Code</th>
                <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                <th style={{ padding: '0.75rem 1rem' }}>Counters</th>
                <th style={{ padding: '0.75rem 1rem' }}>Waiting</th>
                <th style={{ padding: '0.75rem 1rem' }}>In Service</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s: any) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{s.name}</div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#06b6d4' }}>
                      {s.code}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                    {s.location}
                  </td>
                  <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{s.active_counters}</span> open
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      fontWeight: 800,
                      color: s.waiting_count > 0 ? '#fbbf24' : '#64748b',
                      fontSize: '1rem'
                    }}>
                      {s.waiting_count}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      fontWeight: 700,
                      color: s.serving_count > 0 ? '#38bdf8' : '#64748b'
                    }}>
                      {s.serving_count}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {s.is_paused ? (
                      <span className="badge badge-waiting">Paused</span>
                    ) : (
                      <span className="badge badge-completed">Active</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <Link
                      to={`/admin/queues?service_id=${s.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Call Next <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Administrative Modules */}
      <div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Management & Governance Modules</h2>
        <div className="grid-3" style={{ gap: '1.25rem' }}>
          <Link to="/admin/students" className="glass-card" style={{ textDecoration: 'none', transition: 'transform 0.2s', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#38bdf8', marginBottom: '0.5rem' }}>
              <Users size={20} />
              <h3 style={{ fontSize: '1.05rem', color: '#fff', margin: 0 }}>Student Roster</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              Verify student identity records, check active queue tickets, and view student history.
            </p>
          </Link>

          <Link to="/admin/staff" className="glass-card" style={{ textDecoration: 'none', transition: 'transform 0.2s', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#c084fc', marginBottom: '0.5rem' }}>
              <Shield size={20} />
              <h3 style={{ fontSize: '1.05rem', color: '#fff', margin: 0 }}>Staff Operators</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              Allocate operators to counters, monitor desk sessions, and view handled volume.
            </p>
          </Link>

          <Link to="/admin/settings" className="glass-card" style={{ textDecoration: 'none', transition: 'transform 0.2s', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#10b981', marginBottom: '0.5rem' }}>
              <Clock size={20} />
              <h3 style={{ fontSize: '1.05rem', color: '#fff', margin: 0 }}>System Policies</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              Configure operating hours, daily capacity thresholds, and hall audio announcements.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};
