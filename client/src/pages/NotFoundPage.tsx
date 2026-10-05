import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="container" style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '3rem 1.5rem'
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(4rem, 10vw, 7rem)',
        fontWeight: 800,
        color: '#06b6d4',
        textShadow: '0 0 30px rgba(6, 182, 212, 0.4)',
        lineHeight: 1,
        marginBottom: '1rem'
      }}>
        404
      </div>
      <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Page Out of Sequence</h2>
      <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '460px', marginBottom: '2rem' }}>
        The requested queue counter or resource does not exist or has been moved to another station.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Link to="/" className="btn btn-primary">
          <Home size={16} /> Return to Homepage
        </Link>
        <Link to="/services" className="btn btn-secondary">
          <ArrowLeft size={16} /> Browse Services
        </Link>
      </div>
    </div>
  );
};
