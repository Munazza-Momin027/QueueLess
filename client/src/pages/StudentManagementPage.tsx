import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Search,
  RefreshCw,
  Sparkles,
  Phone,
  GraduationCap
} from 'lucide-react';

export const StudentManagementPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStudents = async () => {
    try {
      const res = await api.getAdminStudents();
      setStudents(res.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filtered = students.filter(st => {
    const q = search.toLowerCase();
    return (
      st.name.toLowerCase().includes(q) ||
      st.email.toLowerCase().includes(q) ||
      (st.student_id && st.student_id.toLowerCase().includes(q))
    );
  });

  const totalActiveTokens = students.reduce((acc, st) => acc + (st.active_tokens_count || 0), 0);
  const totalCompletedTokens = students.reduce((acc, st) => acc + (st.completed_tokens_count || 0), 0);

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            <Sparkles size={14} /> Campus Administration
          </div>
          <h1>Student Directory & Roster</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Manage student registrations, verify university IDs, and oversee individual queue participation.
          </p>
        </div>

        <button onClick={loadStudents} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={15} /> Refresh Directory
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Registered Students
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8' }}>
            {students.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Verified student profiles</div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Active Tokens in Queue
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f59e0b' }}>
            {totalActiveTokens}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Students currently waiting</div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Completed Campus Visits
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981' }}>
            {totalCompletedTokens}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Resolved consultations</div>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        {/* Search bar */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by student name, ID or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Showing {filtered.length} of {students.length} students
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Loading student roster...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            No students found matching your search.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Student Profile</th>
                  <th style={{ padding: '0.85rem 1rem' }}>University ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Contact Info</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Queue Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Completed Visits</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Registered</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((st) => (
                  <tr key={st.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {st.name.charAt(0)}
                        </div>
                        <div>
                          <div>{st.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>{st.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {st.student_id ? (
                        <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
                          <GraduationCap size={12} /> {st.student_id}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Not Provided</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>
                      {st.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                          <Phone size={12} /> {st.phone}
                        </div>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Email Only</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {st.active_tokens_count > 0 ? (
                        <span className="badge badge-waiting" style={{ fontSize: '0.75rem' }}>
                          {st.active_tokens_count} Token in Line
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>No Active Tokens</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: '#10b981', fontWeight: 700 }}>
                      {st.completed_tokens_count || 0} visits
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.78rem' }}>
                      {st.created_at ? new Date(st.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
