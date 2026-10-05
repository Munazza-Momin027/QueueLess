import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AppointmentBookingPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultServiceId = searchParams.get('service_id');

  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(defaultServiceId || '');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [purpose, setPurpose] = useState('');
  const [myAppointments, setMyAppointments] = useState<any[]>([]);

  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  // 1. Fetch available services
  useEffect(() => {
    api.getServices()
      .then(res => {
        setServices(res.services || []);
        if (!selectedServiceId && res.services?.length > 0) {
          setSelectedServiceId(String(res.services[0].id));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingServices(false));

    if (user) {
      loadMyAppointments();
    }
  }, [user]);

  // 2. Fetch slots when service or date changes
  useEffect(() => {
    if (!selectedServiceId || !selectedDate) return;
    setLoadingSlots(true);
    setError('');
    setSelectedSlot('');

    api.getSlots(Number(selectedServiceId), selectedDate)
      .then(res => setSlots(res.slots || []))
      .catch(err => setError(err.message || 'Failed to load time slots.'))
      .finally(() => setLoadingSlots(false));
  }, [selectedServiceId, selectedDate]);

  const loadMyAppointments = async () => {
    try {
      const res = await api.getMyAppointments();
      setMyAppointments(res.appointments || []);
    } catch {
      // Ignore
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to book an appointment.');
      return;
    }

    if (!selectedSlot) {
      setError('Please select an available time slot.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.bookAppointment({
        service_id: Number(selectedServiceId),
        appointment_date: selectedDate,
        time_slot: selectedSlot,
        purpose
      });

      setSuccessMsg('Your appointment was successfully scheduled!');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setPurpose('');
      setSelectedSlot('');
      loadMyAppointments();

      // Refresh slots
      api.getSlots(Number(selectedServiceId), selectedDate).then(res => setSlots(res.slots || []));
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppt = async (id: number) => {
    if (!window.confirm('Cancel this scheduled appointment?')) return;
    try {
      await api.cancelAppointment(id);
      loadMyAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel.');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      <div style={{ maxWidth: '840px', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
          <Sparkles size={14} /> Scheduled Counter Access
        </div>
        <h1>Appointment Booking</h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.5rem' }}>
          Need to visit during a specific time interval? Reserve a guaranteed counter slot in advance.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
        gap: '2.5rem',
        alignItems: 'start'
      }}>
        {/* Booking Form */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '1.5rem' }}>Schedule a Slot</h2>

          {successMsg && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> {successMsg}
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleBook}>
            {/* Service selector */}
            <div className="form-group">
              <label className="form-label">Select Campus Department</label>
              <select
                className="form-select"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                required
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) — {s.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CalendarIcon size={14} /> Appointment Date
              </label>
              <input
                type="date"
                className="form-input"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>

            {/* Interactive Slot Grid */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={14} /> Available Time Slots ({selectedDate})
              </label>

              {loadingSlots ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  Checking slot capacity...
                </div>
              ) : slots.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  No available slots for this date.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: '0.6rem',
                  marginTop: '0.5rem'
                }}>
                  {slots.map((s) => {
                    const isSelected = selectedSlot === s.time_slot;
                    return (
                      <button
                        key={s.time_slot}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setSelectedSlot(s.time_slot)}
                        style={{
                          background: isSelected
                            ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
                            : s.available
                              ? 'rgba(255, 255, 255, 0.04)'
                              : 'rgba(255, 255, 255, 0.01)',
                          border: isSelected
                            ? '1px solid #38bdf8'
                            : s.available
                              ? '1px solid var(--border-light)'
                              : '1px solid rgba(255, 255, 255, 0.04)',
                          color: isSelected
                            ? '#fff'
                            : s.available
                              ? '#f8fafc'
                              : '#475569',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.6rem 0.4rem',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: s.available ? 'pointer' : 'not-allowed',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div>{s.time_slot}</div>
                        <div style={{ fontSize: '0.68rem', opacity: isSelected ? 0.9 : 0.6, marginTop: '2px' }}>
                          {s.available ? `${s.remaining_capacity} open` : 'Booked'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Purpose */}
            <div className="form-group">
              <label className="form-label">Purpose / Notes (Optional)</label>
              <textarea
                className="form-textarea"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Reason for meeting with counter officer..."
                rows={2}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {submitting ? 'Confirming...' : 'Book Guaranteed Slot'}
            </button>
          </form>
        </div>

        {/* Existing Appointments List */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>My Scheduled Visits</h2>

          {myAppointments.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: '#94a3b8' }}>
              <CalendarIcon size={32} color="#64748b" style={{ margin: '0 auto 0.75rem auto' }} />
              <p style={{ fontSize: '0.9rem' }}>You have no upcoming booked appointments.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {myAppointments.map(appt => (
                <div key={appt.id} className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                        {appt.service_name}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <MapPin size={13} color="#06b6d4" /> {appt.location}
                      </div>
                    </div>
                    <span className="badge badge-completed" style={{ fontSize: '0.72rem' }}>
                      {appt.status}
                    </span>
                  </div>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    margin: '0.75rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    color: '#38bdf8'
                  }}>
                    <Clock size={15} />
                    <span><strong>{appt.appointment_date}</strong> at <strong>{appt.time_slot}</strong></span>
                  </div>

                  {appt.purpose && (
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                      Note: {appt.purpose}
                    </p>
                  )}

                  {appt.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancelAppt(appt.id)}
                      className="btn btn-danger btn-sm"
                      style={{ width: '100%', fontSize: '0.75rem' }}
                    >
                      <X size={13} /> Cancel Appointment
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
