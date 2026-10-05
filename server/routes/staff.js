import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { broadcastQueueUpdate, notifyUserRealtime } from '../utils/sse.js';

const router = express.Router();

// Strict RBAC: Staff module requires staff or admin privileges.
// Student role calling any of these endpoints receives 403 Forbidden.
router.use(authenticateToken, requireRole('staff', 'admin'));

// GET /api/staff/dashboard - Staff operator overview
router.get('/dashboard', (req, res) => {
  try {
    const staffId = req.user.id;

    // 1. Find assigned counter for this staff member (or any active counter if none explicitly set)
    let assignedCounter = db.prepare(`
      SELECT c.*, s.name as service_name, s.code as service_code, s.location, s.avg_service_mins, s.is_paused
      FROM counters c
      JOIN services s ON c.service_id = s.id
      WHERE c.assigned_staff_id = ? AND c.is_active = 1
      LIMIT 1
    `).get(staffId);

    if (!assignedCounter) {
      // Default to first active counter if staff hasn't claimed a specific desk yet
      assignedCounter = db.prepare(`
        SELECT c.*, s.name as service_name, s.code as service_code, s.location, s.avg_service_mins, s.is_paused
        FROM counters c
        JOIN services s ON c.service_id = s.id
        WHERE c.is_active = 1
        ORDER BY c.id ASC
        LIMIT 1
      `).get();
    }

    const serviceId = assignedCounter ? assignedCounter.service_id : 1;
    const counterId = assignedCounter ? assignedCounter.id : 1;

    // 2. Currently serving token at this counter
    const currentServing = db.prepare(`
      SELECT q.*, u.name as student_name, u.email as student_email, u.student_id, u.phone as student_phone
      FROM queue_entries q
      JOIN users u ON q.user_id = u.id
      WHERE q.counter_id = ? AND q.status IN ('called', 'serving')
      ORDER BY q.called_at DESC
      LIMIT 1
    `).get(counterId);

    // 3. Waiting count in this department/service
    const waitingCount = db.prepare(`
      SELECT COUNT(*) as count FROM queue_entries
      WHERE service_id = ? AND status = 'waiting'
    `).get(serviceId).count;

    // 4. Next 3 students in line (preview)
    const upcomingStudents = db.prepare(`
      SELECT q.id, q.token_number, q.numeric_token, q.joined_at, q.notes, q.priority,
             u.name as student_name, u.student_id
      FROM queue_entries q
      JOIN users u ON q.user_id = u.id
      WHERE q.service_id = ? AND q.status = 'waiting'
      ORDER BY q.priority DESC, q.id ASC
      LIMIT 5
    `).all(serviceId);

    // 5. Today's counter stats
    const todayServed = db.prepare(`
      SELECT COUNT(*) as count FROM queue_entries
      WHERE service_id = ? AND status = 'completed' AND date(completed_at) = date('now')
    `).get(serviceId).count;

    const avgDurationRow = db.prepare(`
      SELECT AVG((strftime('%s', completed_at) - strftime('%s', served_at)) / 60.0) as avg_mins
      FROM queue_entries
      WHERE service_id = ? AND status = 'completed' AND served_at IS NOT NULL AND completed_at IS NOT NULL
        AND date(completed_at) = date('now')
    `).get(serviceId);

    const avgDurationMins = avgDurationRow && avgDurationRow.avg_mins ? Math.round(avgDurationRow.avg_mins * 10) / 10 : 8.5;

    // 6. All available services and counters for quick desk switching
    const services = db.prepare('SELECT id, name, code, is_paused FROM services WHERE is_active = 1').all();
    const counters = db.prepare(`
      SELECT c.*, s.name as service_name, s.code as service_code, u.name as staff_name
      FROM counters c
      JOIN services s ON c.service_id = s.id
      LEFT JOIN users u ON c.assigned_staff_id = u.id
      WHERE c.is_active = 1
      ORDER BY c.service_id ASC, c.counter_number ASC
    `).all();

    res.json({
      staff: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      assignedCounter,
      currentServing,
      waitingCount,
      todayServed,
      avgDurationMins,
      upcomingStudents,
      services,
      counters
    });
  } catch (err) {
    console.error('Staff dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch staff desk operational telemetry.' });
  }
});

// GET /api/staff/queue/:serviceId - Queue desk view for staff
router.get('/queue/:serviceId', (req, res) => {
  try {
    const serviceId = Number(req.params.serviceId);
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Department service not found.' });
    }

    const counters = db.prepare('SELECT * FROM counters WHERE service_id = ? AND is_active = 1 ORDER BY counter_number ASC').all(serviceId);

    const activeEntries = db.prepare(`
      SELECT q.*, u.name as student_name, u.email as student_email, u.phone as student_phone, u.student_id,
             c.counter_number, c.name as counter_name
      FROM queue_entries q
      JOIN users u ON q.user_id = u.id
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
    `).all(serviceId);

    const recentCompleted = db.prepare(`
      SELECT q.*, u.name as student_name, u.student_id, c.counter_number
      FROM queue_entries q
      JOIN users u ON q.user_id = u.id
      LEFT JOIN counters c ON q.counter_id = c.id
      WHERE q.service_id = ? AND q.status IN ('completed', 'skipped', 'cancelled')
      ORDER BY q.id DESC
      LIMIT 20
    `).all(serviceId);

    res.json({
      service,
      counters,
      activeEntries,
      recentCompleted
    });
  } catch (err) {
    console.error('Staff queue view error:', err);
    res.status(500).json({ error: 'Failed to fetch staff queue desk.' });
  }
});

// POST /api/staff/queue/call-next - Staff calls next student
router.post('/queue/call-next', (req, res) => {
  try {
    const { service_id, counter_id, counter_number } = req.body;

    if (!service_id) {
      return res.status(400).json({ error: 'service_id is required.' });
    }

    let counter = null;
    if (counter_id) {
      counter = db.prepare('SELECT * FROM counters WHERE id = ? AND service_id = ?').get(counter_id, service_id);
    } else if (counter_number !== undefined) {
      counter = db.prepare('SELECT * FROM counters WHERE (counter_number = ? OR counter_number = ?) AND service_id = ?').get(String(counter_number), Number(counter_number), service_id);
    }

    if (!counter) {
      return res.status(404).json({ error: 'Valid counter not found for this department.' });
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id);

    // Find next waiting student
    const nextToken = db.prepare(`
      SELECT q.*, u.name as user_name, u.email as user_email
      FROM queue_entries q
      JOIN users u ON q.user_id = u.id
      WHERE q.service_id = ? AND q.status = 'waiting'
      ORDER BY q.priority DESC, q.id ASC
      LIMIT 1
    `).get(service_id);

    if (!nextToken) {
      return res.status(404).json({ message: 'No more students currently waiting in queue for this department.' });
    }

    // Update status to 'called' and assign counter
    db.prepare(`
      UPDATE queue_entries
      SET status = 'called', counter_id = ?, called_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(counter.id, nextToken.id);

    // Notify student in-app
    const notifMsg = `Token ${nextToken.token_number}: Please proceed immediately to ${counter.name} (${service.name})!`;
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Token Now Being Called!', ?, 'call', ?)
    `).run(nextToken.user_id, notifMsg, `/student/track/${nextToken.id}`);

    const eventPayload = {
      type: 'TOKEN_CALLED',
      serviceId: service_id,
      tokenId: nextToken.id,
      tokenNumber: nextToken.token_number,
      counterNumber: counter.counter_number,
      counterName: counter.name,
      serviceName: service.name,
      location: service.location,
      userId: nextToken.user_id,
      timestamp: new Date().toISOString()
    };

    notifyUserRealtime(nextToken.user_id, eventPayload);
    broadcastQueueUpdate(eventPayload);

    // Alert next in line
    const nextInLine = db.prepare(`
      SELECT q.id, q.user_id, q.token_number
      FROM queue_entries q
      WHERE q.service_id = ? AND q.status = 'waiting'
      ORDER BY q.priority DESC, q.id ASC
      LIMIT 1
    `).get(service_id);

    if (nextInLine) {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'Get Ready — You are Next!', ?, 'alert', ?)
      `).run(
        nextInLine.user_id,
        `Token ${nextInLine.token_number}: You are now next in line for ${service.name}. Please stay near ${service.location}.`,
        `/student/track/${nextInLine.id}`
      );
      notifyUserRealtime(nextInLine.user_id, {
        type: 'TURN_APPROACHING',
        tokenNumber: nextInLine.token_number,
        message: 'You are now next in line!'
      });
    }

    const calledPayload = {
      ...nextToken,
      counter_id: counter.id,
      counter_number: counter.counter_number,
      counter_name: counter.name
    };

    res.json({
      message: `Called token ${nextToken.token_number} to Counter ${counter.counter_number}.`,
      calledToken: calledPayload,
      token: calledPayload
    });
  } catch (err) {
    console.error('Call next student error:', err);
    res.status(500).json({ error: 'Failed to call next student in queue.' });
  }
});

// POST or PATCH /api/staff/queue/:id/status - Staff transitions status (serving, completed, skipped)
const handleStatusTransition = (req, res) => {
  try {
    const tokenId = Number(req.params.id);
    const { status, counter_id } = req.body;

    if (!['serving', 'completed', 'skipped'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Staff can only mark serving, completed, or skipped.' });
    }

    const token = db.prepare('SELECT * FROM queue_entries WHERE id = ?').get(tokenId);
    if (!token) {
      return res.status(404).json({ error: 'Token not found.' });
    }

    let sql = 'UPDATE queue_entries SET status = ?';
    const params = [status];

    if (counter_id) {
      sql += ', counter_id = ?';
      params.push(counter_id);
    }

    if (status === 'serving') {
      sql += ', served_at = CURRENT_TIMESTAMP';
    } else if (status === 'completed' || status === 'skipped') {
      sql += ', completed_at = CURRENT_TIMESTAMP';
    }

    sql += ' WHERE id = ?';
    params.push(tokenId);

    db.prepare(sql).run(...params);

    if (status === 'completed') {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'Service Completed — Rate Your Visit', ?, 'complete', ?)
      `).run(
        token.user_id,
        `Your session for token ${token.token_number} has concluded. Please take a few seconds to rate our counter staff!`,
        '/student/history'
      );
    }

    broadcastQueueUpdate({
      type: 'TOKEN_STATUS_UPDATED',
      tokenId,
      tokenNumber: token.token_number,
      serviceId: token.service_id,
      status
    });

    res.json({ message: `Token ${token.token_number} successfully marked as ${status}.` });
  } catch (err) {
    console.error('Staff update token status error:', err);
    res.status(500).json({ error: 'Failed to update token status.' });
  }
};
router.post('/queue/:id/status', handleStatusTransition);
router.patch('/queue/:id/status', handleStatusTransition);

// POST /api/staff/queue/:id/recall - Staff recalls/re-announces student token
router.post('/queue/:id/recall', (req, res) => {
  try {
    const tokenId = Number(req.params.id);
    const entry = db.prepare(`
      SELECT q.*, s.name as service_name, s.location, c.counter_number, c.name as counter_name
      FROM queue_entries q
      JOIN services s ON q.service_id = s.id
      LEFT JOIN counters c ON q.counter_id = c.id
      WHERE q.id = ?
    `).get(tokenId);

    if (!entry) {
      return res.status(404).json({ error: 'Token not found.' });
    }

    const eventPayload = {
      type: 'TOKEN_RECALLED',
      tokenId: entry.id,
      tokenNumber: entry.token_number,
      serviceId: entry.service_id,
      serviceName: entry.service_name,
      counterNumber: entry.counter_number || '1',
      counterName: entry.counter_name || 'Desk',
      location: entry.location,
      userId: entry.user_id,
      timestamp: new Date().toISOString()
    };

    notifyUserRealtime(entry.user_id, eventPayload);
    broadcastQueueUpdate(eventPayload);

    res.json({ message: `Token ${entry.token_number} re-announced successfully.` });
  } catch (err) {
    console.error('Staff recall token error:', err);
    res.status(500).json({ error: 'Failed to re-announce token.' });
  }
});

// GET /api/staff/history - Completed tokens handled today
router.get('/history', (req, res) => {
  try {
    const history = db.prepare(`
      SELECT q.*, s.name as service_name, s.code as service_code,
             c.counter_number, c.name as counter_name,
             u.name as student_name, u.student_id,
             f.rating as feedback_rating, f.comments as feedback_comments
      FROM queue_entries q
      JOIN services s ON q.service_id = s.id
      JOIN users u ON q.user_id = u.id
      LEFT JOIN counters c ON q.counter_id = c.id
      LEFT JOIN feedback f ON f.queue_entry_id = q.id
      WHERE q.status IN ('completed', 'skipped')
      ORDER BY q.completed_at DESC
      LIMIT 50
    `).all();

    res.json({ history });
  } catch (err) {
    console.error('Staff history error:', err);
    res.status(500).json({ error: 'Failed to load staff history.' });
  }
});

// GET /api/staff/stats - Staff operational performance metrics
router.get('/stats', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const todayStats = db.prepare(`
      SELECT
        COUNT(*) as total_processed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped_count,
        AVG(CASE WHEN status = 'completed' AND served_at IS NOT NULL AND completed_at IS NOT NULL
                 THEN (strftime('%s', completed_at) - strftime('%s', served_at)) / 60.0
                 ELSE NULL END) as avg_handling_mins
      FROM queue_entries
      WHERE date(completed_at) = ?
    `).get(today);

    const feedbackStats = db.prepare(`
      SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM feedback
    `).get();

    res.json({
      todayStats: {
        totalProcessed: todayStats.total_processed || 0,
        completedCount: todayStats.completed_count || 0,
        skippedCount: todayStats.skipped_count || 0,
        avgHandlingMins: todayStats.avg_handling_mins ? Math.round(todayStats.avg_handling_mins * 10) / 10 : 8
      },
      feedback: {
        totalReviews: feedbackStats.count || 0,
        averageRating: feedbackStats.avg_rating ? Math.round(feedbackStats.avg_rating * 10) / 10 : 4.8
      }
    });
  } catch (err) {
    console.error('Staff stats error:', err);
    res.status(500).json({ error: 'Failed to fetch staff statistics.' });
  }
});

export default router;
