import express from 'express';
import { db } from '../db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { calculateEstimatedWait } from '../utils/estimation.js';
import { broadcastQueueUpdate, notifyUserRealtime, registerSSEClient } from '../utils/sse.js';

const router = express.Router();

// GET /api/queues/stream - Real-time SSE event stream for live dashboard & tracking
router.get('/stream', optionalAuth, (req, res) => {
  registerSSEClient(req, res);
});

// POST /api/queues/join - Join a virtual queue
router.post('/join', authenticateToken, (req, res) => {
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
      return res.status(400).json({ error: 'Queue joining for this service is temporarily paused by staff. Please try again shortly.' });
    }

    // Rule: Prevent duplicate active queue entry for the same user and service
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

    // Find or create today's session
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

    // Increment token number atomically
    const nextNumeric = Math.max(session.last_token_number, highestEver) + 1;
    db.prepare('UPDATE queue_sessions SET last_token_number = ? WHERE id = ?').run(nextNumeric, session.id);

    const tokenNumber = `${service.code}-${nextNumeric}`;

    // Count people ahead
    const peopleAheadRow = db.prepare(`
      SELECT COUNT(*) as count FROM queue_entries
      WHERE service_id = ? AND status = 'waiting'
    `).get(service_id);
    const peopleAhead = peopleAheadRow ? peopleAheadRow.count : 0;

    const waitCalc = calculateEstimatedWait(service_id, peopleAhead);

    // Insert queue entry
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

    // Create confirmation notification for user
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, 'info', ?)
    `).run(
      userId,
      `Token Issued: ${tokenNumber}`,
      `You joined the queue for ${service.name}. You have ${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead.`,
      `/track/${queueEntryId}`
    );

    const payload = {
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
    };

    // Broadcast update via SSE to all listeners & admin boards
    broadcastQueueUpdate({
      type: 'QUEUE_JOINED',
      serviceId: service_id,
      tokenNumber,
      peopleAhead
    });

    res.status(201).json({
      message: `Successfully joined ${service.name} queue.`,
      token: payload
    });
  } catch (err) {
    console.error('Queue join error:', err);
    res.status(500).json({ error: 'Failed to join queue.' });
  }
});

// GET /api/queues/my-active - Get user's active tokens
router.get('/my-active', authenticateToken, (req, res) => {
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

    const enriched = entries.map(entry => {
      // Calculate people ahead
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

    res.json({ activeTokens: enriched });
  } catch (err) {
    console.error('Fetch my-active tokens error:', err);
    res.status(500).json({ error: 'Failed to fetch active tokens.' });
  }
});

// GET /api/queues/token/:id - Get specific token status and tracking telemetry
router.get('/token/:id', (req, res) => {
  try {
    const tokenId = Number(req.params.id);
    const entry = db.prepare(`
      SELECT q.*, s.name as service_name, s.code as service_code, s.location, s.avg_service_mins, s.is_paused,
             c.counter_number, c.name as counter_name, u.name as user_name, u.student_id
      FROM queue_entries q
      JOIN services s ON q.service_id = s.id
      JOIN users u ON q.user_id = u.id
      LEFT JOIN counters c ON q.counter_id = c.id
      WHERE q.id = ?
    `).get(tokenId);

    if (!entry) {
      return res.status(404).json({ error: 'Token not found.' });
    }

    // Calculate dynamic people ahead
    let peopleAhead = 0;
    if (entry.status === 'waiting') {
      const aheadRow = db.prepare(`
        SELECT COUNT(*) as count FROM queue_entries
        WHERE service_id = ? AND status = 'waiting' AND id < ?
      `).get(entry.service_id, entry.id);
      peopleAhead = aheadRow ? aheadRow.count : 0;
    }

    // Active counters count
    const countersCountRow = db.prepare(`
      SELECT COUNT(*) as count FROM counters WHERE service_id = ? AND is_active = 1
    `).get(entry.service_id);
    const activeCountersCount = countersCountRow ? countersCountRow.count : 1;

    // Currently serving token for this service
    const servingRow = db.prepare(`
      SELECT token_number, counter_id FROM queue_entries
      WHERE service_id = ? AND status = 'serving'
      ORDER BY called_at DESC LIMIT 1
    `).get(entry.service_id);

    const waitCalc = calculateEstimatedWait(entry.service_id, peopleAhead);

    res.json({
      token: {
        ...entry,
        people_ahead: peopleAhead,
        active_counters_count: activeCountersCount,
        currently_serving_token: servingRow ? servingRow.token_number : 'None',
        live_estimated_wait_mins: entry.status === 'waiting' ? waitCalc.estimatedMins : 0,
        wait_factors: waitCalc.factors,
        wait_explanation: waitCalc.explanation,
        wait_disclaimer: waitCalc.disclaimer
      }
    });
  } catch (err) {
    console.error('Fetch token details error:', err);
    res.status(500).json({ error: 'Failed to retrieve token details.' });
  }
});

// POST /api/queues/token/:id/cancel - User cancels queue token
router.post('/token/:id/cancel', authenticateToken, (req, res) => {
  try {
    const tokenId = Number(req.params.id);
    const entry = db.prepare('SELECT * FROM queue_entries WHERE id = ?').get(tokenId);

    if (!entry) {
      return res.status(404).json({ error: 'Token not found.' });
    }

    // Authorization: Must be owner or admin
    if (entry.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to cancel this token.' });
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

// GET /api/queues/history - User queue history
router.get('/history', authenticateToken, (req, res) => {
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
    console.error('Queue history error:', err);
    res.status(500).json({ error: 'Failed to fetch queue history.' });
  }
});

// GET /api/queues/display - Public hall kiosk & display board data (no auth required)
router.get('/display', (req, res) => {
  try {
    const services = db.prepare(`
      SELECT id, name, code, description, location, avg_service_mins, is_active, is_paused
      FROM services
      WHERE is_active = 1
      ORDER BY id ASC
    `).all();

    const displayData = services.map(service => {
      const counters = db.prepare(`
        SELECT id, counter_number, name, is_active
        FROM counters
        WHERE service_id = ? AND is_active = 1
        ORDER BY counter_number ASC
      `).all(service.id);

      const activeEntries = db.prepare(`
        SELECT q.id, q.token_number, q.numeric_token, q.status, q.counter_id,
               q.joined_at, q.called_at, q.served_at,
               c.counter_number, c.name as counter_name
        FROM queue_entries q
        LEFT JOIN counters c ON q.counter_id = c.id
        WHERE q.service_id = ? AND q.status IN ('waiting', 'called', 'serving')
        ORDER BY
          CASE q.status
            WHEN 'serving' THEN 1
            WHEN 'called' THEN 2
            WHEN 'waiting' THEN 3
            ELSE 4
          END,
          q.priority DESC,
          q.id ASC
      `).all(service.id);

      const waitingCount = activeEntries.filter(e => e.status === 'waiting').length;
      const waitCalc = calculateEstimatedWait(service.id, waitingCount);

      return {
        service,
        counters,
        activeEntries,
        waitingCount,
        estimatedWaitMins: waitCalc.estimatedMins
      };
    });

    const settingsRows = db.prepare('SELECT key, value FROM system_settings').all();
    const settings = {};
    settingsRows.forEach(r => { settings[r.key] = r.value; });

    res.json({
      services: displayData,
      settings,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Display board error:', err);
    res.status(500).json({ error: 'Failed to fetch display board telemetry.' });
  }
});

export default router;
