import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Shield,
  Plus,
  Edit2,
  Pause,
  Play,
  Monitor,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Sparkles,
  X
} from 'lucide-react';

export const ServiceManagementPage: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  // New Service Form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Academic');
  const [location, setLocation] = useState('');
  const [avgMins, setAvgMins] = useState(10);
  const [capacity, setCapacity] = useState(150);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('17:00');

  // New Counter Form
  const [counterNumber, setCounterNumber] = useState('');
  const [counterName, setCounterName] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadServices = async () => {
    try {
      const res = await api.getServices();
      setServices(res.services || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleTogglePause = async (service: any) => {
    try {
      await api.updateService(service.id, { is_paused: service.is_paused ? 0 : 1 });
      loadServices();
    } catch (err: any) {
      alert(err.message || 'Failed to update service.');
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.createService({
        name,
        code,
        description,
        category,
        location,
        avg_service_mins: avgMins,
        daily_capacity: capacity,
        open_time: openTime,
        close_time: closeTime
      });

      setModalOpen(false);
      setName('');
      setCode('');
      setDescription('');
      setLocation('');
      loadServices();
    } catch (err: any) {
      setError(err.message || 'Failed to create service.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) return;
    setSaving(true);
    setError('');

    try {
      await api.addCounter(selectedServiceId, {
        counter_number: counterNumber,
        name: counterName
      });
      setCounterModalOpen(false);
      setCounterNumber('');
      setCounterName('');
      loadServices();
    } catch (err: any) {
      setError(err.message || 'Failed to add counter.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            <Sparkles size={14} /> Service Operations
          </div>
          <h1>Department & Counter Configuration</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Create campus services, toggle live queues, adjust target handling times, and allocate counters.
          </p>
        </div>

        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          <Plus size={18} /> Add New Service
        </button>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          Loading service configuration...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {services.map(s => (
            <div key={s.id} className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#38bdf8', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.82rem' }}>
                      {s.code}
                    </span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>{s.category}</span>
                    {s.is_paused ? (
                      <span className="badge badge-waiting" style={{ fontSize: '0.72rem' }}>Queue Paused</span>
                    ) : (
                      <span className="badge badge-completed" style={{ fontSize: '0.72rem' }}>Active</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.35rem' }}>{s.name}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.86rem', maxWidth: '680px', lineHeight: '1.5' }}>{s.description}</p>
                </div>

                {/* Status Toggle & Counter Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    onClick={() => { setSelectedServiceId(s.id); setCounterModalOpen(true); }}
                    className="btn btn-secondary btn-sm"
                  >
                    <Plus size={14} /> Add Counter
                  </button>

                  <button
                    onClick={() => handleTogglePause(s)}
                    className={`btn btn-sm ${s.is_paused ? 'btn-success' : 'btn-danger'}`}
                  >
                    {s.is_paused ? <Play size={14} /> : <Pause size={14} />}
                    {s.is_paused ? 'Resume Queue' : 'Pause Queue'}
                  </button>
                </div>
              </div>

              {/* Service Config Pills */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
                color: '#94a3b8'
              }}>
                <div>
                  <span style={{ color: '#64748b' }}>Location: </span>
                  <strong style={{ color: '#fff' }}>{s.location}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Avg Handling Time: </span>
                  <strong style={{ color: '#38bdf8' }}>~{s.avg_service_mins} mins</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Active Counters: </span>
                  <strong style={{ color: '#10b981' }}>{s.active_counters_count || 1}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Hours: </span>
                  <strong style={{ color: '#fff' }}>{s.open_time} – {s.close_time}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add New Service */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModalOpen(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '0.35rem' }}>Create Campus Service</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Add a new office or lab department to QueueLess.</p>

            {error && <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fda4af', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleCreateService}>
              <div className="form-group">
                <label className="form-label">Service / Department Name</label>
                <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Examination & Grade Verification Desk" required />
              </div>

              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Code Prefix (2-4 letters)</label>
                  <input type="text" className="form-input" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="EXM" maxLength={5} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="Academic">Academic</option>
                    <option value="Financial">Financial</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Library">Library</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location / Room Number</label>
                <input type="text" className="form-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Main Block, Hall B, Room 102" required />
              </div>

              <div className="form-group">
                <label className="form-label">Description of Services Offered</label>
                <textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Official grade transcripts, duplicate marksheets..." rows={2} />
              </div>

              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Avg Mins / Person</label>
                  <input type="number" className="form-input" value={avgMins} onChange={e => setAvgMins(Number(e.target.value))} min={1} max={60} />
                </div>
                <div className="form-group">
                  <label className="form-label">Daily Capacity</label>
                  <input type="number" className="form-input" value={capacity} onChange={e => setCapacity(Number(e.target.value))} min={10} max={500} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>{saving ? 'Creating...' : 'Create Service'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Counter */}
      {counterModalOpen && (
        <div className="modal-overlay" onClick={() => setCounterModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setCounterModalOpen(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '0.35rem' }}>Add Service Counter</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Configure an additional physical counter for this queue.</p>

            <form onSubmit={handleAddCounter}>
              <div className="form-group">
                <label className="form-label">Counter Number</label>
                <input type="text" className="form-input" value={counterNumber} onChange={e => setCounterNumber(e.target.value)} placeholder="e.g. 4" required />
              </div>
              <div className="form-group">
                <label className="form-label">Counter Description Label</label>
                <input type="text" className="form-input" value={counterName} onChange={e => setCounterName(e.target.value)} placeholder="e.g. Counter 4 — Priority & Clearances" required />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setCounterModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>{saving ? 'Adding...' : 'Add Counter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
