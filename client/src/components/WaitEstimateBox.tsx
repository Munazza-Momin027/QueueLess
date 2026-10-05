import React from 'react';
import { Clock, Users, Monitor, Info } from 'lucide-react';

interface WaitEstimateProps {
  estimatedMins: number;
  peopleAhead: number;
  activeCounters?: number;
  explanation?: string;
  disclaimer?: string;
  factors?: {
    peopleAhead?: number;
    activeCounters?: number;
    handlingTimePerPersonMins?: number;
    method?: string;
  };
}

export const WaitEstimateBox: React.FC<WaitEstimateProps> = ({
  estimatedMins,
  peopleAhead,
  activeCounters = 1,
  explanation,
  disclaimer = 'Estimated waiting time — actual time may vary based on individual inquiry complexity.',
  factors
}) => {
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(14, 22, 38, 0.7) 0%, rgba(20, 30, 52, 0.5) 100%)',
      border: '1px solid rgba(6, 182, 212, 0.25)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.15)',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 600 }}>
              AI Queuing Telemetry
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <span>~{estimatedMins} mins</span>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 500 }}>(Estimated Wait)</span>
            </div>
          </div>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'rgba(245, 158, 11, 0.12)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          padding: '0.2rem 0.6rem',
          borderRadius: '9999px',
          fontSize: '0.72rem',
          fontWeight: 600
        }}>
          Dynamic Estimate
        </div>
      </div>

      {/* Factor Breakdown Chips */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem 0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
            <Users size={13} /> People Ahead
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
            {peopleAhead}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem 0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
            <Monitor size={13} /> Active Counters
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
            {activeCounters}
          </div>
        </div>

        {factors?.handlingTimePerPersonMins && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
              <Clock size={13} /> Turnaround / Ticket
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              ~{factors.handlingTimePerPersonMins} mins
            </div>
          </div>
        )}
      </div>

      {explanation && (
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.75rem', lineHeight: '1.5' }}>
          {explanation}
        </p>
      )}

      {/* Mandatory Disclaimer as per project objective */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.45rem',
        padding: '0.6rem 0.85rem',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(6, 182, 212, 0.06)',
        border: '1px solid rgba(6, 182, 212, 0.18)',
        fontSize: '0.78rem',
        color: '#7dd3fc',
        lineHeight: '1.4'
      }}>
        <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>{disclaimer}</span>
      </div>
    </div>
  );
};
