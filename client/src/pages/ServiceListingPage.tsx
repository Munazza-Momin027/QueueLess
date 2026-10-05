import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import {
  Search,
  Filter,
  Layers,
  Clock,
  Users,
  MapPin,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export const ServiceListingPage: React.FC = () => {
  const location = useLocation();
  const isStudentPortal = location.pathname.startsWith('/student');
  const [services, setServices] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getServices()
      .then(res => {
        setServices(res.services || []);
        setFilteredServices(res.services || []);
      })
      .catch(err => console.error('Error fetching services:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = services;

    if (selectedCategory !== 'All') {
      result = result.filter(s => s.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.location && s.location.toLowerCase().includes(q))
      );
    }

    setFilteredServices(result);
  }, [searchQuery, selectedCategory, services]);

  const categories = ['All', 'Academic', 'Financial', 'Healthcare', 'Library', 'Technical'];

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Title & Search Bar */}
      <div style={{ maxWidth: '780px', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
          <Sparkles size={14} /> Campus Department Directory
        </div>
        <h1>Browse Campus Services</h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.5rem' }}>
          Select any college service desk to view live counter activity, estimated wait telemetry, or join the virtual queue remotely.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '2.5rem'
      }}>
        {/* Search input */}
        <div style={{ position: 'relative', maxWidth: '520px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service by name, code (e.g. REG, FIN), or room..."
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', marginRight: '0.25rem' }}>Filter by:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn btn-sm"
              style={{
                background: selectedCategory === cat ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' : 'rgba(255, 255, 255, 0.04)',
                color: selectedCategory === cat ? '#fff' : '#94a3b8',
                border: selectedCategory === cat ? 'none' : '1px solid var(--border-subtle)',
                fontSize: '0.8rem'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          Loading campus services and queue counters...
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
            No campus services match your search filter.
          </p>
        </div>
      ) : (
        <div className="grid-3" style={{ gap: '1.75rem' }}>
          {filteredServices.map(service => (
            <div key={service.id} className="glass-card glass-card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    color: '#38bdf8',
                    background: 'rgba(6, 182, 212, 0.12)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    {service.code}
                  </div>
                  <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                    {service.category}
                  </span>
                </div>

                {service.is_paused ? (
                  <span className="badge badge-waiting" style={{ fontSize: '0.7rem' }}>
                    Paused
                  </span>
                ) : (
                  <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>
                    Open
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>
                {service.name}
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#94a3b8', marginBottom: '1.25rem', flex: 1, lineHeight: '1.5' }}>
                {service.description}
              </p>

              {/* Location & Hours */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} color="#06b6d4" />
                  <span>{service.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={14} color="#a78bfa" />
                  <span>{service.open_time} – {service.close_time}</span>
                </div>
              </div>

              {/* Real-time Telemetry Bar */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Waiting in Queue</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                    {service.waiting_count}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Est. Wait Time</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>
                    ~{service.estimated_wait_mins} mins
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link
                  to={isStudentPortal ? `/student/services/${service.id}` : `/services/${service.id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                >
                  Details
                </Link>
                <Link
                  to={isStudentPortal ? `/student/services/${service.id}/join` : `/services/${service.id}/join`}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={(e) => {
                    if (service.is_paused) {
                      e.preventDefault();
                      alert('Queue joining is temporarily paused for this service.');
                    }
                  }}
                >
                  Join Queue <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
