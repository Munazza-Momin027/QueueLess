import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useQueueStream } from '../hooks/useQueueStream';
import { useSoundAlert } from '../hooks/useSoundAlert';
import {
  Clock,
  Volume2,
  VolumeX,
  Sparkles,
  Maximize2,
  Monitor
} from 'lucide-react';

export const PublicDisplayBoardPage: React.FC = () => {
  const { playChime } = useSoundAlert();
  const [deskData, setDeskData] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [latestCall, setLatestCall] = useState<any>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadLobbyData = async () => {
    try {
      const res = await api.getPublicDisplay();
      setDeskData(res.services || []);
      if (res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error('Display board load error:', err);
    }
  };

  useEffect(() => {
    loadLobbyData();
    const interval = setInterval(loadLobbyData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Real-time SSE synchronization
  useQueueStream((event) => {
    loadLobbyData();
    if (event.type === 'TOKEN_CALLED') {
      if (soundEnabled) playChime();
      setLatestCall(event);
      setTimeout(() => setLatestCall(null), 12000);
    }
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#040711',
      color: '#f8fafc',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Kiosk Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid rgba(6, 182, 212, 0.4)',
        paddingBottom: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(6, 182, 212, 0.5)'
          }}>
            <Clock size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Queue<span style={{ color: '#06b6d4' }}>Less</span>
            </h1>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              {settings?.campus_name || 'Metropolitan State University'} • Live Waiting Hall Display
            </div>
          </div>
        </div>

        {/* Live Clock & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2rem',
              fontWeight: 800,
              color: '#38bdf8',
              textShadow: '0 0 15px rgba(56, 189, 248, 0.5)'
            }}>
              {currentTime}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
              All Counters Synchronized
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="btn btn-secondary btn-sm"
              title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
            >
              {soundEnabled ? <Volume2 size={18} color="#06b6d4" /> : <VolumeX size={18} color="#64748b" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="btn btn-secondary btn-sm"
              title="Toggle Fullscreen"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Campus Announcement Ticker */}
      {settings?.announcement_ticker && (
        <div style={{
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.88rem',
          color: '#38bdf8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} />
            <span>{settings.announcement_ticker}</span>
          </div>
          {settings.operating_hours && (
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Desk Hours: {settings.operating_hours}
            </div>
          )}
        </div>
      )}

      {/* Latest Call Broadcast Alert Banner */}
      {latestCall && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)',
          border: '2px solid #a78bfa',
          marginBottom: '2rem',
          animation: 'pulse-ring 2s infinite'
        }}>
          <div style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>
            🔔 NOW CALLING
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '3.5rem',
            fontWeight: 800,
            margin: '0.25rem 0',
            letterSpacing: '0.05em'
          }}>
            {latestCall.tokenNumber} &rarr; Counter {latestCall.counterNumber || '1'}
          </div>
          <div style={{ fontSize: '1.1rem', color: '#e0e7ff' }}>
            {latestCall.serviceName} • {latestCall.location}
          </div>
        </div>
      )}

      {/* Department Counter Board Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.75rem',
        flex: 1
      }}>
        {deskData.map((d: any, idx: number) => {
          const s = d.service;
          const activeServing = d.activeEntries?.filter((e: any) => e.status === 'serving' || e.status === 'called');
          const waitingQueue = d.activeEntries?.filter((e: any) => e.status === 'waiting');

          return (
            <div
              key={s?.id || idx}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Department Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#06b6d4', fontSize: '0.85rem' }}>
                    {s?.code}
                  </span>
                  <h2 style={{ fontSize: '1.3rem', color: '#fff', margin: '0.2rem 0' }}>{s?.name}</h2>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{s?.location}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Waiting</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24' }}>
                    {waitingQueue?.length || 0}
                  </div>
                </div>
              </div>

              {/* Counters Now Serving */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Counters Currently Serving:
                </div>

                {activeServing?.length === 0 ? (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px dashed rgba(255, 255, 255, 0.15)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    color: '#64748b'
                  }}>
                    Counters Standing By
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    {activeServing.map((t: any) => (
                      <div
                        key={t.id}
                        style={{
                          background: t.status === 'called' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(6, 182, 212, 0.15)',
                          border: t.status === 'called' ? '1px solid #a78bfa' : '1px solid #06b6d4',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                          Counter {t.counter_number || '1'}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '1.8rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          margin: '0.2rem 0'
                        }}>
                          {t.token_number}
                        </div>
                        <span className={`badge ${t.status === 'called' ? 'badge-called' : 'badge-serving'}`} style={{ fontSize: '0.65rem' }}>
                          {t.status === 'called' ? 'CALLED' : 'SERVING'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Next Up Ticker */}
              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                  Next in Line:
                </div>
                {waitingQueue?.length === 0 ? (
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>No tickets waiting</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {waitingQueue.slice(0, 5).map((w: any, wIdx: number) => (
                      <span
                        key={w.id}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          background: 'rgba(255, 255, 255, 0.06)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '4px',
                          color: wIdx === 0 ? '#38bdf8' : '#94a3b8',
                          border: wIdx === 0 ? '1px solid rgba(56, 189, 248, 0.4)' : 'none'
                        }}
                      >
                        {w.token_number}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
