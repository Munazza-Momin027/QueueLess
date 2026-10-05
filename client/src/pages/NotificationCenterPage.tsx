import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  CheckCheck,
  ChevronRight,
  Sparkles,
  Volume2
} from 'lucide-react';

export const NotificationCenterPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'call'>('all');

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      loadNotifications();
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      loadNotifications();
    } catch {}
  };

  const handleClearRead = async () => {
    try {
      await api.clearReadNotifications();
      loadNotifications();
    } catch {}
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'call') return n.type === 'call' || n.type === 'alert';
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Volume2 size={18} color="#c084fc" />;
      case 'alert':
        return <AlertTriangle size={18} color="#f59e0b" />;
      case 'complete':
        return <CheckCircle2 size={18} color="#10b981" />;
      default:
        return <Info size={18} color="#06b6d4" />;
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem', maxWidth: '780px' }}>
      {/* Title Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            <Sparkles size={14} /> Activity Feed
          </div>
          <h1>Notification Center</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
            Live queue call alerts, position countdowns, and completion notices.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm">
              <CheckCheck size={14} /> Mark All Read
            </button>
          )}
          <button onClick={handleClearRead} className="btn btn-secondary btn-sm" title="Clear read notifications">
            <Trash2 size={14} /> Clear Read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setFilter('all')}
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('call')}
          className={`btn btn-sm ${filter === 'call' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Call Announcements
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          Loading your notifications...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#94a3b8' }}>
          <Bell size={36} color="#64748b" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ color: '#fff', marginBottom: '0.25rem' }}>No Notifications</h3>
          <p style={{ fontSize: '0.88rem' }}>You're all caught up! Relevant queue notifications appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(notif => (
            <div
              key={notif.id}
              className="glass-card"
              style={{
                padding: '1.25rem',
                borderLeft: !notif.is_read ? '3px solid #06b6d4' : '1px solid var(--border-subtle)',
                background: !notif.is_read ? 'rgba(6, 182, 212, 0.05)' : 'var(--bg-card)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {getIcon(notif.type)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                      {notif.title}
                    </span>
                    {!notif.is_read && (
                      <span className="badge badge-cyan" style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem' }}>
                        New
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.45', marginBottom: '0.5rem' }}>
                    {notif.message}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                {notif.link && (
                  <Link to={notif.link} className="btn btn-primary btn-sm" style={{ fontSize: '0.78rem' }}>
                    Open <ChevronRight size={13} />
                  </Link>
                )}
                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="btn btn-secondary btn-sm"
                    title="Mark as read"
                    style={{ padding: '0.4rem' }}
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
