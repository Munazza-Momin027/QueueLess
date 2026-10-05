import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Sparkles,
  Save,
  CheckCircle2,
  Volume2,
  Shield,
  Building
} from 'lucide-react';

export const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    campus_name: 'Metropolitan State University',
    operating_hours: '08:30 AM - 05:00 PM',
    max_daily_capacity: '150',
    sound_chime_enabled: 'true',
    sms_notifications_enabled: 'true',
    auto_call_delay_seconds: '30'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    api.getAdminSettings()
      .then(res => {
        if (res.settings && Object.keys(res.settings).length > 0) {
          setSettings(res.settings);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.updateAdminSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save system settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
        Loading campus system configuration...
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
          <Sparkles size={14} /> Operational Controls
        </div>
        <h1>System Settings & Campus Policies</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Configure institution-wide queue capacity, operational timetables, audio chime alerts, and notification channels.
        </p>
      </div>

      <form onSubmit={handleSave} className="glass-card" style={{ padding: '2.5rem 2rem' }}>
        {savedSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '2rem'
          }}>
            <CheckCircle2 size={18} />
            <span>Settings successfully saved and propagated across campus queue nodes!</span>
          </div>
        )}

        {/* Institution Info */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Building size={18} color="#06b6d4" /> Institution & Campus Identity
          </h3>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
              Campus / University Name
            </label>
            <input
              type="text"
              value={settings.campus_name || ''}
              onChange={(e) => handleChange('campus_name', e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                Default Operating Hours
              </label>
              <input
                type="text"
                value={settings.operating_hours || ''}
                onChange={(e) => handleChange('operating_hours', e.target.value)}
                className="input-field"
                placeholder="e.g. 08:30 AM - 05:00 PM"
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                Daily Department Capacity Limit
              </label>
              <input
                type="number"
                value={settings.max_daily_capacity || '150'}
                onChange={(e) => handleChange('max_daily_capacity', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Queue Hardware & Audio Announcements */}
        <div style={{ marginBottom: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Volume2 size={18} color="#38bdf8" /> Waiting Hall Audio & Visual Hardware
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>Synthesizer Audio Chimes</div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Play crystal chord chime when ticket numbers are announced in kiosk hall</div>
            </div>
            <input
              type="checkbox"
              checked={settings.sound_chime_enabled === 'true'}
              onChange={(e) => handleChange('sound_chime_enabled', e.target.checked ? 'true' : 'false')}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>Real-Time In-App Push Telemetry</div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Deliver automatic 'Turn Approaching' alerts to students when 2nd in line</div>
            </div>
            <input
              type="checkbox"
              checked={settings.sms_notifications_enabled === 'true'}
              onChange={(e) => handleChange('sms_notifications_enabled', e.target.checked ? 'true' : 'false')}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Security & Access Architecture */}
        <div style={{ marginBottom: '2.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Shield size={18} color="#10b981" /> RBAC & Security Enforcement
          </h3>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5' }}>
            QueueLess enforces strict 3-tier Role-Based Access Control: <strong>STUDENT</strong>, <strong>STAFF</strong>, and <strong>ADMIN</strong>.
            All routes, direct URLs, and REST APIs cryptographically verify authentication tokens and role authorization on every single request.
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Save size={18} /> {saving ? 'Saving System Changes...' : 'Save Configuration Changes'}
        </button>
      </form>
    </div>
  );
};
