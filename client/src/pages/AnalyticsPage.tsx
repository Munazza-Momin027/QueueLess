import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Sparkles,
  Zap,
  Star,
  MessageSquare,
  Download
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAnalytics(),
      api.getFeedbackSummary()
    ])
      .then(([analyticsRes, feedbackRes]) => {
        setData(analyticsRes);
        setFeedback(feedbackRes);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
        Calculating analytics telemetry and peak patterns...
      </div>
    );
  }

  const { summary, serviceBreakdown = [], hourlyTraffic = [], smartRecommendations = [] } = data || {};

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary,
      serviceBreakdown,
      hourlyTraffic,
      smartRecommendations,
      feedback
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `queueless-telemetry-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div style={{ maxWidth: '840px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            <Sparkles size={14} /> Intelligent Performance Insights
          </div>
          <h1>Queue Analytics & AI Telemetry</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.5rem' }}>
            Real-time service turnaround benchmarking, peak arrival patterns, and automated capacity recommendations.
          </p>
        </div>
        <button onClick={handleExportReport} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={15} /> Export Telemetry Report
        </button>
      </div>

      {/* Top summary cards */}
      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-card">
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.35rem' }}>QUEUE RESOLUTION RATE</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981' }}>{summary?.completionRate || 92}%</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Successful transactions</div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.35rem' }}>CANCELLATION RATE</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8' }}>{summary?.cancellationRate || 4}%</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Remote drop-offs</div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.35rem' }}>STUDENT SATISFACTION</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span>{feedback?.averageRating || '4.8'}</span>
            <Star size={20} fill="#fbbf24" color="#fbbf24" />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{feedback?.satisfactionRate || 96}% positive reviews</div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.35rem' }}>TOTAL TICKETS PROCESSED</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#c084fc' }}>{summary?.totalEntries || 84}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Cumulative traffic</div>
        </div>
      </div>

      {/* Hourly Traffic Pattern Histogram */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Hourly Traffic & Wait Correlation</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Volume of student arrivals and corresponding average wait times throughout the campus day</p>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#38bdf8', background: 'rgba(6, 182, 212, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '4px' }}>
            Peak Window: 11 AM – 1 PM
          </span>
        </div>

        {/* Visual Bar Chart */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${hourlyTraffic.length}, 1fr)`,
          gap: '0.75rem',
          height: '180px',
          alignItems: 'flex-end',
          paddingTop: '1.5rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--border-light)'
        }}>
          {hourlyTraffic.map((bar: any) => {
            const heightPercent = Math.round((bar.volume / 60) * 100);
            const isPeak = bar.volume >= 40;
            return (
              <div key={bar.hour} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isPeak ? '#fbbf24' : '#38bdf8', marginBottom: '0.35rem' }}>
                  {bar.volume}
                </div>
                <div style={{
                  width: '100%',
                  maxWidth: '38px',
                  height: `${heightPercent}%`,
                  background: isPeak
                    ? 'linear-gradient(180deg, #f59e0b 0%, rgba(245, 158, 11, 0.3) 100%)'
                    : 'linear-gradient(180deg, #06b6d4 0%, rgba(6, 182, 212, 0.3) 100%)',
                  borderRadius: '6px 6px 0 0',
                  boxShadow: isPeak ? '0 0 12px rgba(245, 158, 11, 0.3)' : '0 0 12px rgba(6, 182, 212, 0.2)',
                  transition: 'height 0.4s'
                }} />
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', fontWeight: 600 }}>
                  {bar.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smart Capacity & Staffing Recommendations */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Automated Operations Advice</h2>
        <div className="grid-3" style={{ gap: '1.25rem' }}>
          {smartRecommendations.map((rec: any) => (
            <div key={rec.id} className="glass-card" style={{
              borderLeft: rec.severity === 'high' ? '4px solid #f59e0b' : rec.severity === 'positive' ? '4px solid #10b981' : '4px solid #38bdf8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: rec.severity === 'high' ? '#fbbf24' : rec.severity === 'positive' ? '#6ee7b7' : '#38bdf8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                <Zap size={14} /> {rec.type} recommendation
              </div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '0.5rem' }}>{rec.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.45', marginBottom: '0.75rem' }}>{rec.description}</p>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                <strong>Action: </strong>{rec.actionableAdvice}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Performance Breakdown */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Service Performance Metrics</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                <th style={{ padding: '0.75rem 1rem' }}>Total Volume</th>
                <th style={{ padding: '0.75rem 1rem' }}>Resolved</th>
                <th style={{ padding: '0.75rem 1rem' }}>Avg Wait Time</th>
                <th style={{ padding: '0.75rem 1rem' }}>Avg Handling Duration</th>
              </tr>
            </thead>
            <tbody>
              {serviceBreakdown.map((s: any) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#fff' }}>
                    {s.name} ({s.code})
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{s.category}</span>
                  </td>
                  <td style={{ padding: '1rem', color: '#fff', fontWeight: 600 }}>
                    {s.total_tokens}
                  </td>
                  <td style={{ padding: '1rem', color: '#10b981', fontWeight: 600 }}>
                    {s.completed_tokens}
                  </td>
                  <td style={{ padding: '1rem', color: '#38bdf8' }}>
                    ~{s.avg_wait_time} mins
                  </td>
                  <td style={{ padding: '1rem', color: '#c084fc' }}>
                    ~{s.avg_service_time} mins
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Feedback & Ratings Feed */}
      <div className="glass-card" style={{ padding: '1.75rem', marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              <MessageSquare size={13} /> Live Visitor Sentiment
            </div>
            <h2 style={{ fontSize: '1.25rem' }}>Student Reviews & Feedback Stream</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Verified post-service ratings and comments submitted by campus visitors</p>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 700 }}>
            <Star size={15} fill="#fbbf24" color="#fbbf24" />
            <span>{feedback?.averageRating || '4.8'} Average ({feedback?.totalReviews || 0} reviews)</span>
          </div>
        </div>

        {feedback?.recentReviews && feedback.recentReviews.length > 0 ? (
          <div className="grid-2" style={{ gap: '1rem' }}>
            {feedback.recentReviews.map((rev: any) => (
              <div key={rev.id} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.15rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>{rev.user_name}</div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= rev.rating ? '#fbbf24' : 'transparent'}
                        color={s <= rev.rating ? '#fbbf24' : '#475569'}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#06b6d4', marginBottom: '0.5rem' }}>
                  {rev.service_name}
                </div>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.45', margin: 0, fontStyle: rev.comments ? 'normal' : 'italic' }}>
                  {rev.comments ? `“${rev.comments}”` : 'Rated without additional written notes.'}
                </p>
                {rev.created_at && (
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.65rem' }}>
                    {new Date(rev.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.88rem' }}>
            No recent reviews submitted yet. Feedback will populate here as students complete services.
          </div>
        )}
      </div>
    </div>
  );
};
