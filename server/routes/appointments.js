import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const STANDARD_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '01:30 PM', '02:00 PM',
  '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'
];

// GET /api/appointments/slots - Get available slots for service & date
router.get('/slots', (req, res) => {
  try {
    const { service_id, date } = req.query;

    if (!service_id || !date) {
      return res.status(400).json({ error: 'service_id and date are required query parameters.' });
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(Number(service_id));
    if (!service) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    // Get booked slots for this service and date
    const booked = db.prepare(`
      SELECT time_slot, COUNT(*) as count
      FROM appointments
      WHERE service_id = ? AND appointment_date = ? AND status != 'cancelled'
      GROUP BY time_slot
    `).all(Number(service_id), date);

    const bookedMap = {};
    for (const b of booked) {
      bookedMap[b.time_slot] = b.count;
    }

    // Allow max 3 appointments per slot (based on multiple counters)
    const activeCounters = db.prepare('SELECT COUNT(*) as count FROM counters WHERE service_id = ? AND is_active = 1').get(Number(service_id)).count;
    const maxPerSlot = Math.max(1, activeCounters);

    const slots = STANDARD_SLOTS.map(slot => {
      const bookedCount = bookedMap[slot] || 0;
      return {
        time_slot: slot,
        available: bookedCount < maxPerSlot,
        remaining_capacity: Math.max(0, maxPerSlot - bookedCount)
      };
    });

    res.json({
      service: { id: service.id, name: service.name, location: service.location },
      date,
      slots
    });
  } catch (err) {
    console.error('Fetch appointment slots error:', err);
    res.status(500).json({ error: 'Failed to fetch appointment slots.' });
  }
});

// POST /api/appointments/book - Book a new appointment
router.post('/book', authenticateToken, (req, res) => {
  try {
    const { service_id, appointment_date, time_slot, purpose } = req.body;
    const userId = req.user.id;

    if (!service_id || !appointment_date || !time_slot) {
      return res.status(400).json({ error: 'Service, appointment date, and time slot are required.' });
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(Number(service_id));
    if (!service) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    // Prevent duplicate booking for same user, service, and date
    const existing = db.prepare(`
      SELECT id FROM appointments
      WHERE user_id = ? AND service_id = ? AND appointment_date = ? AND status != 'cancelled'
    `).get(userId, Number(service_id), appointment_date);

    if (existing) {
      return res.status(409).json({ error: 'You already have an active appointment for this service on this date.' });
    }

    const result = db.prepare(`
      INSERT INTO appointments (service_id, user_id, appointment_date, time_slot, purpose, status)
      VALUES (?, ?, ?, ?, ?, 'confirmed')
    `).run(Number(service_id), userId, appointment_date, time_slot, purpose ? purpose.trim() : null);

    const apptId = Number(result.lastInsertRowid);

    // Create confirmation in-app notification
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Appointment Confirmed', ?, 'info', '/appointments')
    `).run(
      userId,
      `Your appointment for ${service.name} is booked on ${appointment_date} at ${time_slot}. Location: ${service.location}.`
    );

    res.status(201).json({
      message: 'Appointment booked successfully!',
      appointment: {
        id: apptId,
        service_id: Number(service_id),
        service_name: service.name,
        location: service.location,
        appointment_date,
        time_slot,
        purpose,
        status: 'confirmed'
      }
    });
  } catch (err) {
    console.error('Book appointment error:', err);
    res.status(500).json({ error: 'Failed to book appointment.' });
  }
});

// GET /api/appointments/my - Get user's appointments
router.get('/my', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const appointments = db.prepare(`
      SELECT a.*, s.name as service_name, s.code as service_code, s.location
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.user_id = ?
      ORDER BY a.appointment_date ASC, a.time_slot ASC
    `).all(userId);

    res.json({ appointments });
  } catch (err) {
    console.error('Fetch my appointments error:', err);
    res.status(500).json({ error: 'Failed to retrieve appointments.' });
  }
});

// POST /api/appointments/:id/cancel - Cancel appointment
router.post('/:id/cancel', authenticateToken, (req, res) => {
  try {
    const apptId = Number(req.params.id);
    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(apptId);

    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    if (appt.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to cancel this appointment.' });
    }

    db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(apptId);
    res.json({ message: 'Appointment cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel appointment.' });
  }
});

export default router;
