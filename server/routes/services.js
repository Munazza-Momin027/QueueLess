import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { calculateEstimatedWait, getRecommendedVisitingTimes } from '../utils/estimation.js';
import { broadcastQueueUpdate } from '../utils/sse.js';

const router = express.Router();

// GET /api/services - List all services with live queue status
router.get('/', (req, res) => {
  try {
    const services = db.prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM counters c WHERE c.service_id = s.id AND c.is_active = 1) as active_counters_count,
        (SELECT COUNT(*) FROM queue_entries q WHERE q.service_id = s.id AND q.status = 'waiting') as waiting_count,
        (SELECT COUNT(*) FROM queue_entries q WHERE q.service_id = s.id AND q.status = 'serving') as serving_count,
        (SELECT q.token_number FROM queue_entries q WHERE q.service_id = s.id AND q.status = 'serving' ORDER BY q.called_at DESC LIMIT 1) as current_serving_token
      FROM services s
      WHERE s.is_active = 1
      ORDER BY s.id ASC
    `).all();

    // Enrich with dynamic wait time estimation for each service
    const enriched = services.map(s => {
      const waitCalc = calculateEstimatedWait(s.id, s.waiting_count);
      return {
        ...s,
        estimated_wait_mins: waitCalc.estimatedMins,
        wait_factors: waitCalc.factors,
        wait_disclaimer: waitCalc.disclaimer
      };
    });

    res.json({ services: enriched });
  } catch (err) {
    console.error('Fetch services error:', err);
    res.status(500).json({ error: 'Failed to fetch services.' });
  }
});

// GET /api/services/:id - Get service details with counters & queue telemetry
router.get('/:id', (req, res) => {
  try {
    const serviceId = Number(req.params.id);
    const service = db.prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM queue_entries q WHERE q.service_id = s.id AND q.status = 'waiting') as waiting_count,
        (SELECT COUNT(*) FROM queue_entries q WHERE q.service_id = s.id AND q.status = 'serving') as serving_count,
        (SELECT q.token_number FROM queue_entries q WHERE q.service_id = s.id AND q.status = 'serving' ORDER BY q.called_at DESC LIMIT 1) as current_serving_token
      FROM services s
      WHERE s.id = ?
    `).get(serviceId);

    if (!service) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    const counters = db.prepare(`
      SELECT c.*, u.name as staff_name,
        (SELECT q.token_number FROM queue_entries q WHERE q.counter_id = c.id AND q.status = 'serving' LIMIT 1) as current_token
      FROM counters c
      LEFT JOIN users u ON c.assigned_staff_id = u.id
      WHERE c.service_id = ?
      ORDER BY c.counter_number ASC
    `).all(serviceId);

    const waitCalc = calculateEstimatedWait(serviceId, service.waiting_count);
    const recommendations = getRecommendedVisitingTimes(serviceId);

    res.json({
      service: {
        ...service,
        estimated_wait_mins: waitCalc.estimatedMins,
        wait_explanation: waitCalc.explanation,
        wait_factors: waitCalc.factors,
        wait_disclaimer: waitCalc.disclaimer,
        counters,
        recommendations
      }
    });
  } catch (err) {
    console.error('Fetch service detail error:', err);
    res.status(500).json({ error: 'Failed to load service details.' });
  }
});

// POST /api/services - (Admin) Create service
router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name, code, description, category, location, avg_service_mins, daily_capacity, open_time, close_time, icon_name } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Service name and code are required.' });
    }

    const formattedCode = code.trim().toUpperCase();
    const existing = db.prepare('SELECT id FROM services WHERE code = ?').get(formattedCode);
    if (existing) {
      return res.status(409).json({ error: 'A service with this code already exists.' });
    }

    const result = db.prepare(`
      INSERT INTO services (name, code, description, category, location, avg_service_mins, daily_capacity, open_time, close_time, icon_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      formattedCode,
      description || '',
      category || 'General',
      location || 'Campus Center',
      Number(avg_service_mins) || 10,
      Number(daily_capacity) || 120,
      open_time || '09:00',
      close_time || '17:00',
      icon_name || 'Layers'
    );

    const newServiceId = Number(result.lastInsertRowid);

    // Auto-create Counter 1
    db.prepare(`
      INSERT INTO counters (service_id, counter_number, name, assigned_staff_id, is_active)
      VALUES (?, '1', ?, ?, 1)
    `).run(newServiceId, `${name.trim()} - Counter 1`, req.user.id);

    broadcastQueueUpdate({ type: 'SERVICE_CREATED', serviceId: newServiceId });
    res.status(201).json({ message: 'Service created successfully.', serviceId: newServiceId });
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ error: 'Failed to create service.' });
  }
});

// PUT /api/services/:id - (Admin) Update service
router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const serviceId = Number(req.params.id);
    const { name, description, category, location, avg_service_mins, daily_capacity, is_paused, open_time, close_time } = req.body;

    db.prepare(`
      UPDATE services
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          location = COALESCE(?, location),
          avg_service_mins = COALESCE(?, avg_service_mins),
          daily_capacity = COALESCE(?, daily_capacity),
          is_paused = COALESCE(?, is_paused),
          open_time = COALESCE(?, open_time),
          close_time = COALESCE(?, close_time)
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      description,
      category,
      location,
      avg_service_mins ? Number(avg_service_mins) : null,
      daily_capacity ? Number(daily_capacity) : null,
      is_paused !== undefined ? Number(is_paused) : null,
      open_time,
      close_time,
      serviceId
    );

    broadcastQueueUpdate({ type: 'SERVICE_UPDATED', serviceId });
    res.json({ message: 'Service updated successfully.' });
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ error: 'Failed to update service.' });
  }
});

// POST /api/services/:id/counters - (Admin) Add counter
router.post('/:id/counters', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const serviceId = Number(req.params.id);
    const { counter_number, name } = req.body;

    if (!counter_number || !name) {
      return res.status(400).json({ error: 'Counter number and label are required.' });
    }

    const result = db.prepare(`
      INSERT INTO counters (service_id, counter_number, name, assigned_staff_id, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(serviceId, String(counter_number), name.trim(), req.user.id);

    broadcastQueueUpdate({ type: 'COUNTER_ADDED', serviceId, counterId: result.lastInsertRowid });
    res.status(201).json({ message: 'Counter added successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create counter.' });
  }
});

// PUT /api/counters/:id - (Admin) Toggle counter
router.put('/counters/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const counterId = Number(req.params.id);
    const { is_active } = req.body;

    db.prepare('UPDATE counters SET is_active = ? WHERE id = ?').run(Number(is_active), counterId);
    broadcastQueueUpdate({ type: 'COUNTER_UPDATED', counterId });
    res.json({ message: 'Counter status updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update counter.' });
  }
});

export default router;
