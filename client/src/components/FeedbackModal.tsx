import React, { useState } from 'react';
import { Star, X, Check, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

interface FeedbackModalProps {
  queueEntryId?: number;
  serviceId: number;
  serviceName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  queueEntryId,
  serviceId,
  serviceName,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.submitFeedback({
        queue_entry_id: queueEntryId,
        service_id: serviceId,
        rating,
        comments
      });

      setSubmitted(true);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        setSubmitted(false);
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <Check size={28} />
            </div>
            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Thank You!</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Your feedback helps optimize campus counter operations.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.25rem' }}>
                Rate Your Visit
              </div>
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>{serviceName}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                How smooth was your service experience today?
              </p>
            </div>

            {error && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fda4af', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            {/* Star selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    transition: 'transform 0.1s'
                  }}
                >
                  <Star
                    size={36}
                    color={(hoverRating || rating) >= star ? '#f59e0b' : '#334155'}
                    fill={(hoverRating || rating) >= star ? '#f59e0b' : 'transparent'}
                  />
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MessageSquare size={14} /> Comments or Suggestions (Optional)
              </label>
              <textarea
                className="form-textarea"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Staff was helpful, quick verification, lobby was clear..."
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
                Skip
              </button>
              <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
