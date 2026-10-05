import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { calculateEstimatedWait } from '../utils/estimation.js';
import { broadcastQueueUpdate } from '../utils/sse.js';

const router = express.Router();

// Strict RBAC: Student endpoints require student or admin privileges.
// Staff role is forbidden from calling student-exclusive endpoints.
router.use(authenticateToken, requireRole('student', 'admin'));

// GET /api/student/dashboard - Student's live dashboard data
router.get('/dashboard', (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch user's active tokens
    const activeEntries = db.prepare(`
      SELECT q.*, s.name as service_name, s.code as service_code, s.location, s.avg_service_mins,
             c.counter_number, c.name as counter_name
      FROM queue_entries q
      JOIN services s ON q.service_id = s.id
      LEFT JOIN counters c ON q.counter_id = c.id
      WHERE q.user_id = ? AND q.status IN ('waiting', 'called', 'serving')
      ORDER BY q.id DESC
    `).all(userId);

    const activeTokens = activeEntries.map(entry => {
      let peopleAhead = 0;
      if (entry.status === 'waiting') {
        const row = db.prepare(`
          SELECT COUNT(*) as count FROM queue_entries
          WHERE service_id = ? AND status = 'waiting' AND id < ?
        `).get(entry.service_id, entry.id);
        peopleAhead = row ? row.count : 0;
      }
      const waitCalc = calculateEstimatedWait(entry.service_id, peopleAhead);
      return {
        ...entry,
        people_ahead: peopleAhead,
        live_estimated_wait_mins: entry.status === 'waiting' ? waitCalc.estimatedMins : 0,
        wait_factors: waitCalc.factors,
        wait_disclaimer: waitCalc.disclaimer
      };
    });

    // 2. Upcoming appointments
    const today = new Date().toISOString().split('T')[0];
    const upcomingAppointments = db.prepare(`
      SELECT a.*, s.name as service_name, s.code as service_code, s.location
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.user_id = ? AND a.appointment_date >= ? AND a.status = 'confirmed'
      ORDER BY a.appointment_date ASC, a.time_slot ASC
      LIMIT 3
    `).all(userId, today);

    // 3. Unread notifications count
    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(userId).count;

    // 4. Recent completed or past tokens
    const recentHistory = db.prepare(`
      SELECT q.*, s.name as service_name, s.code as service_code, s.location,
             c.counter_number, f.rating as user_rating
      FROM queue_entries q
      JOIN services s ON q.service_id = s.id
      LEFT JOIN counters c ON q.counter_id = c.id
      LEFT JOIN feedback f ON f.queue_entry_id = q.id
      WHERE q.user_id = ? AND q.status IN ('completed', 'cancelled', 'skipped')
      ORDER BY q.id DESC
      LIMIT 5
    `).all(userId);

    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        student_id: req.user.student_id,
        phone: req.user.phone
      },
      activeTokens,
      upcomingAppointments,
      unreadCount,
      recentHistory
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch student dashboard data.' });
  }
});

// POST /api/student/queue/join - Student joins a virtual queue
router.post('/queue/join', (req, res) => {
  try {
    const { service_id, notes, priority = 0 } = req.body;
    const userId = req.user.id;

    if (!service_id) {
      return res.status(400).json({ error: 'Service ID is required.' });
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    if (!service.is_active) {
      return res.status(400).json({ error: 'This service is currently inactive.' });
    }

    if (service.is_paused) {
      return res.status(400).json({ error: 'Queue joining for this service is temporarily paused by campus staff.' });
    }

    // Rule: Prevent duplicate active token for same student and service
    const existingActive = db.prepare(`
      SELECT id, token_number, status FROM queue_entries
      WHERE service_id = ? AND user_id = ? AND status IN ('waiting', 'called', 'serving')
    `).get(service_id, userId);

    if (existingActive) {
      return res.status(409).json({
        error: `You already hold an active token (${existingActive.token_number}) in this queue.`,
        activeToken: existingActive
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Find or create session
    let session = db.prepare(`
      SELECT * FROM queue_sessions WHERE service_id = ? AND session_date = ?
    `).get(service_id, today);

    const maxNumericRow = db.prepare('SELECT MAX(numeric_token) as maxNum FROM queue_entries WHERE service_id = ?').get(service_id);
    const highestEver = (maxNumericRow && maxNumericRow.maxNum) ? maxNumericRow.maxNum : (service_id * 100);

    if (!session) {
      const initTokenBase = Math.max(service_id * 100, highestEver);
      const sessResult = db.prepare(`
        INSERT INTO queue_sessions (service_id, session_date, last_token_number, status)
        VALUES (?, ?, ?, 'active')
      `).run(service_id, today, initTokenBase);

      session = {
        id: Number(sessResult.lastInsertRowid),
        service_id,
        session_date: today,
        last_token_number: initTokenBase,
        status: 'active'
      };
    }

    const nextNumeric = Math.max(session.last_token_number, highestEver) + 1;
    db.prepare('UPDATE queue_sessions SET last_token_number = ? WHERE id = ?').run(nextNumeric, session.id);

    const tokenNumber = `${service.code}-${nextNumeric}`;

    const peopleAheadRow = db.prepare(`
      SELECT COUNT(*) as count FROM queue_entries
      WHERE service_id = ? AND status = 'waiting'
    `).get(service_id);
    const peopleAhead = peopleAheadRow ? peopleAheadRow.count : 0;

    const waitCalc = calculateEstimatedWait(service_id, peopleAhead);

    const insertResult = db.prepare(`
      INSERT INTO queue_entries (
        token_number, numeric_token, session_id, service_id, user_id,
        status, priority, notes, estimated_wait_mins
      ) VALUES (?, ?, ?, ?, ?, 'waiting', ?, ?, ?)
    `).run(
      tokenNumber,
      nextNumeric,
      session.id,
      service_id,
      userId,
      priority,
      notes ? notes.trim() : null,
      waitCalc.estimatedMins
    );

    const queueEntryId = Number(insertResult.lastInsertRowid);

    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, 'info', ?)
    `).run(
      userId,
      `Token Issued: ${tokenNumber}`,
      `You joined the queue for ${service.name}. You have ${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead.`,
      `/student/track/${queueEntryId}`
    );

    broadcastQueueUpdate({
      type: 'QUEUE_JOINED',
      serviceId: service_id,
      tokenNumber,
      peopleAhead
    });

    res.status(201).json({
      message: `Successfully joined ${service.name} queue.`,
      token: {
        id: queueEntryId,
        token_number: tokenNumber,
        numeric_token: nextNumeric,
        service_id,
        service_name: service.name,
        service_code: service.code,
        location: service.location,
        status: 'waiting',
        people_ahead: peopleAhead,
        estimated_wait_mins: waitCalc.estimatedMins,
        wait_factors: waitCalc.factors,
        wait_disclaimer: waitCalc.disclaimer,
        joined_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Student join queue error:', err);
    res.status(500).json({ error: 'Failed to join queue.' });
  }
});

// GET /api/student/queue/active - Student's active tickets only
router.get('/queue/active', (req, res) => {
  try {
    const userId = req.user.id;
    const entries = db.prepare(`
      SELECT q.*, s.name as service_name, s.code as service_code, s.location, s.avg_service_mins,
             c.counter_number, c.name as counter_name
      FROM queue_entries q
      JOIN services s ON q.service_id = s.id
      LEFT JOIN counters c ON q.counter_id = c.id
      WHERE q.user_id = ? AND q.status IN ('waiting', 'called', 'serving')
      ORDER BY q.id DESC
    `).all(userId);

    const activeTokens = entries.map(entry => {
      let peopleAhead = 0;
      if (entry.status === 'waiting') {
        const row = db.prepare(`
          SELECT COUNT(*) as count FROM queue_entries
          WHERE service_id = ? AND status = 'waiting' AND id < ?
        `).get(entry.service_id, entry.id);
        peopleAhead = row ? row.count : 0;
      }
      const waitCalc = calculateEstimatedWait(entry.service_id, peopleAhead);
      return {
        ...entry,
        people_ahead: peopleAhead,
        live_estimated_wait_mins: entry.status === 'waiting' ? waitCalc.estimatedMins : 0,
        wait_factors: waitCalc.factors,
        wait_disclaimer: waitCalc.disclaimer
      };
    });

    res.json({ activeTokens });
  } catch (err) {
    console.error('Fetch student active tokens error:', err);
    res.status(500).json({ error: 'Failed to fetch active tokens.' });
  }
});

// POST /api/student/queue/token/:id/cancel - Student cancels their own token (IDOR check)
router.post('/queue/token/:id/cancel', (req, res) => {
  try {
    const tokenId = Number(req.params.id);
    const entry = db.prepare('SELECT * FROM queue_entries WHERE id = ?').get(tokenId);

    if (!entry) {
      return res.status(404).json({ error: 'Token not found.' });
    }

    // IDOR Protection: verify user owns this token (or is admin)
    if (entry.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: You can only cancel your own queue tokens.' });
    }

    if (['completed', 'cancelled'].includes(entry.status)) {
      return res.status(400).json({ error: `Cannot cancel a token that is already ${entry.status}.` });
    }

    db.prepare(`
      UPDATE queue_entries SET status = 'cancelled', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(tokenId);

    broadcastQueueUpdate({
      type: 'TOKEN_CANCELLED',
      serviceId: entry.service_id,
      tokenId: entry.id,
      tokenNumber: entry.token_number
    });

    res.json({ message: 'Your token was successfully cancelled.' });
  } catch (err) {
    console.error('Cancel token error:', err);
    res.status(500).json({ error: 'Failed to cancel token.' });
  }
});

// GET /api/student/queue/history - Student's past queue records
router.get('/queue/history', (req, res) => {
  try {
    const userId = req.user.id;
    const history = db.prepare(`
      SELECT q.*, s.name as service_name, s.code as service_code, s.location,
             c.counter_number, c.name as counter_name,
             f.rating as user_rating, f.comments as user_comments
      FROM queue_entries q
      JOIN services s ON q.service_id = s.id
      LEFT JOIN counters c ON q.counter_id = c.id
      LEFT JOIN feedback f ON f.queue_entry_id = q.id
      WHERE q.user_id = ?
      ORDER BY q.id DESC
      LIMIT 50
    `).all(userId);

    res.json({ history });
  } catch (err) {
    console.error('Student queue history error:', err);
    res.status(500).json({ error: 'Failed to fetch queue history.' });
  }
});

export default router;
