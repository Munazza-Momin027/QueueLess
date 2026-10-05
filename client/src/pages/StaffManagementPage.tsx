import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Briefcase,
  Users,
  RefreshCw,
  Sparkles,
  Phone,
  Mail,
  Layers,
  CheckCircle2,
  Edit2,
  X
} from 'lucide-react';

export const StaffManagementPage: React.FC = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState<any>(null);
  const [selectedCounterId, setSelectedCounterId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  const loadData = async () => {
    try {
      const [staffRes, servicesRes] = await Promise.all([
        api.getAdminStaff(),
        api.getServices()
      ]);
      setStaffList(staffRes.staff || []);
      setServices(servicesRes.services || []);
    } catch (err) {
      console.error('Failed to load staff management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAssignModal = (member: any) => {
    setAssignModal(member);
    setSelectedCounterId(member.counter_id ? String(member.counter_id) : '');
  };

  const handleSaveAssignment = async () => {
    if (!assignModal || !selectedCounterId) return;
    setAssigning(true);
    try {
      await api.adminAssignStaffCounter(assignModal.id, Number(selectedCounterId));
      setAssignModal(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign staff to counter.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            <Sparkles size={14} /> Campus Administration
          </div>
          <h1>Staff Operators & Counter Allocation</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Assign authorized counter personnel, manage active desk stations, and review staff operational throughput.
          </p>
        </div>

        <button onClick={loadData} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={15} /> Refresh Staff Data
        </button>
      </div>

      {/* Staff Roster Table Card */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Loading staff roster...
          </div>
        ) : staffList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            No staff members found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Staff Officer</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Assigned Department Desk</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Counter Number</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Today's Consultations</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((member) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div>{member.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {member.service_name ? (
                        <div>
                          <span style={{ fontWeight: 600, color: '#ffffff' }}>{member.service_name}</span>
                          <span className="badge badge-cyan" style={{ marginLeft: '0.4rem', fontSize: '0.68rem' }}>{member.service_code}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic' }}>Unassigned Desk</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {member.counter_number ? (
                        <span style={{
                          background: 'rgba(139, 92, 246, 0.2)',
                          color: '#c4b5fd',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}>
                          Counter {member.counter_number}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: '#10b981', fontWeight: 800 }}>
                      {member.completed_today || 0} served
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-serving" style={{ fontSize: '0.7rem' }}>
                        Authorized Staff
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={() => handleOpenAssignModal(member)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Edit2 size={13} /> Assign Desk
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Counter Assignment Modal */}
      {assignModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 99,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Assign Service Counter</h3>
              <button onClick={() => setAssignModal(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Select a service counter station to assign to <strong>{assignModal.name}</strong>.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                Select Active Counter Station
              </label>
              <select
                value={selectedCounterId}
                onChange={(e) => setSelectedCounterId(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              >
                <option value="">-- Choose Counter --</option>
                {services.map((svc) => (
                  <optgroup key={svc.id} label={`${svc.name} (${svc.code})`}>
                    <option value={svc.id}>
                      {svc.name} — Counter 1
                    </option>
                    <option value={svc.id + 10}>
                      {svc.name} — Counter 2
                    </option>
                  </optgroup>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setAssignModal(null)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={handleSaveAssignment}
                disabled={assigning || !selectedCounterId}
                className="btn btn-primary btn-sm"
              >
                {assigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
