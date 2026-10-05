import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      marginTop: 'auto',
      background: 'rgba(7, 10, 20, 0.95)',
      borderTop: '1px solid var(--border-subtle)',
      padding: '3rem 0 2rem 0',
      color: '#64748b',
      fontSize: '0.85rem'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2.5rem'
        }}>
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Clock size={18} />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
                Queue<span style={{ color: '#06b6d4' }}>Less</span>
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#94a3b8', marginBottom: '1rem' }}>
              Next-generation intelligent virtual queue platform engineered for modern campus operations, academic departments, laboratories, and clinics.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.78rem', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
              All Campus Queues & Counters Operational
            </div>
          </div>

          {/* Quick Access */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '1rem' }}>Student & Visitor</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/services">Available Campus Services</Link>
              <Link to="/dashboard">Active Digital Tokens</Link>
              <Link to="/appointments">Book Scheduled Slot</Link>
              <Link to="/history">Service History & Receipts</Link>
              <Link to="/display" target="_blank">Lobby Screen Display</Link>
            </div>
          </div>

          {/* Admin Tools */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '1rem' }}>Administration & Staff</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/admin">Executive Queue Dashboard</Link>
              <Link to="/admin/queues">Operator Desk (Call Next)</Link>
              <Link to="/admin/services">Department & Counter Setup</Link>
              <Link to="/admin/analytics">Wait Times & Performance</Link>
            </div>
          </div>

          {/* Competition Badge */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '1rem' }}>Competition Protocol</h4>
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontWeight: 700 }}>
                <Sparkles size={16} /> WEBNOVA 2026 PS-11
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                State-Level Technical Challenge. Compliant with transparent wait estimation, zero fake queue claims, and role-based privacy protocols.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#a78bfa' }}>
                <ShieldCheck size={14} /> WCAG AA Accessible
              </div>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem'
        }}>
          <div>
            © 2026 QueueLess Platform. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            Engineered with <Heart size={13} color="#f43f5e" fill="#f43f5e" /> for intelligent queue management
          </div>
        </div>
      </div>
    </footer>
  );
};
