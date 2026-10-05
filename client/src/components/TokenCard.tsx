import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Share2, MapPin, Clock, Users, Volume2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSoundAlert } from '../hooks/useSoundAlert';

interface TokenCardProps {
  token: {
    id: number;
    token_number: string;
    service_name: string;
    service_code?: string;
    location?: string;
    status: string;
    counter_number?: string;
    counter_name?: string;
    people_ahead?: number;
    live_estimated_wait_mins?: number;
    estimated_wait_mins?: number;
    joined_at?: string;
    user_name?: string;
    notes?: string;
  };
  showActions?: boolean;
  onCancel?: (tokenId: number) => void;
}

export const TokenCard: React.FC<TokenCardProps> = ({ token, showActions = true, onCancel }) => {
  const waitMins = token.live_estimated_wait_mins !== undefined ? token.live_estimated_wait_mins : (token.estimated_wait_mins || 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'called':
        return <span className="badge badge-called">Now Called</span>;
      case 'serving':
        return <span className="badge badge-serving">Currently Serving</span>;
      case 'waiting':
        return <span className="badge badge-waiting">In Queue</span>;
      case 'completed':
        return <span className="badge badge-completed">Completed</span>;
      case 'skipped':
        return <span className="badge badge-skipped">Skipped</span>;
      case 'cancelled':
        return <span className="badge badge-cancelled">Cancelled</span>;
      default:
        return <span className="badge badge-waiting">{status}</span>;
    }
  };

  const [copied, setCopied] = useState(false);
  const { playChime } = useSoundAlert();

  const handlePrint = () => {
    window.print();
  };

  const verificationUrl = `${window.location.origin}/track/${token.id}`;

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(verificationUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="hologram-token" style={{ maxWidth: '460px', margin: '0 auto' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#06b6d4', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Official Digital Pass
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
            {token.service_name}
          </div>
        </div>
        <div>
          {getStatusBadge(token.status)}
        </div>
      </div>

      {/* Main Token Identifier */}
      <div style={{
        background: 'rgba(6, 182, 212, 0.05)',
        border: '1px dashed rgba(6, 182, 212, 0.4)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem 1rem',
        margin: '1rem 0'
      }}>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Token Identifier
        </div>
        <div className="token-code">
          {token.token_number}
        </div>
        {token.counter_number ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            color: '#c4b5fd',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>
            Proceed to Counter {token.counter_number}
          </div>
        ) : (
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Counter will be assigned when called
          </div>
        )}
      </div>

      {/* Telemetry Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.85rem',
        textAlign: 'left',
        margin: '1.5rem 0'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
            <Users size={13} /> People Ahead
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
            {token.status === 'waiting' ? token.people_ahead : 0}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
            <Clock size={13} /> Est. Wait Time
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>
            {token.status === 'waiting' ? `~${waitMins}m` : '0m'}
          </div>
        </div>
      </div>

      {/* Location */}
      {token.location && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
          <MapPin size={14} color="#06b6d4" />
          <span>{token.location}</span>
        </div>
      )}

      {/* QR Code Verification Section */}
      <div style={{
        background: '#ffffff',
        padding: '0.85rem',
        borderRadius: '16px',
        width: '130px',
        height: '130px',
        margin: '0 auto 1.5rem auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 25px rgba(255, 255, 255, 0.15)'
      }}>
        <QRCodeSVG value={verificationUrl} size={110} level="M" />
      </div>

      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '1.5rem' }}>
        Scan at counter or kiosk scanner to verify digital ticket.
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <Link to={`/track/${token.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
              Live Queue Tracker
            </Link>
            <button
              onClick={() => playChime()}
              className="btn btn-secondary btn-sm"
              title="Test alert chime sound"
              aria-label="Test chime"
            >
              <Volume2 size={15} />
            </button>
            <button
              onClick={handleShare}
              className="btn btn-secondary btn-sm"
              title="Copy or share digital pass link"
              aria-label="Share ticket link"
              style={{ color: copied ? '#10b981' : undefined }}
            >
              {copied ? <Check size={15} /> : <Share2 size={15} />}
            </button>
            <button onClick={handlePrint} className="btn btn-secondary btn-sm" title="Print or Save Pass">
              <Printer size={15} />
            </button>
          </div>
          {onCancel && ['waiting', 'called'].includes(token.status) && (
            <button
              type="button"
              onClick={() => onCancel(token.id)}
              className="btn btn-danger btn-sm"
              style={{ width: '100%', fontSize: '0.78rem', padding: '0.4rem' }}
            >
              Leave Queue / Cancel Ticket
            </button>
          )}
        </div>
      )}
    </div>
  );
};
