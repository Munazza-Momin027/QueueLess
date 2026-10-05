import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { broadcastQueueUpdate, notifyUserRealtime } from '../utils/sse.js';

const router = express.Router();

// Strict RBAC: Admin module strictly requires admin role!
// Students and Staff are strictly blocked with 403 Forbidden.
router.use(authenticateToken, requireRole('admin'));

// GET /api/admin/overview - High-level operational telemetry
router.get('/overview', (req, res) => {
  try {
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
    const totalStaff = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'staff'").get().count;

    const totalServedToday = db.prepare(`
      SELECT COUNT(*) as count FROM queue_entries
      WHERE status = 'completed' AND date(completed_at) = date('now')
    `).get().count;

    const totalWaitingNow = db.prepare(`
      SELECT COUNT(*) as count FROM queue_entries
      WHERE status = 'waiting'
    `).get().count;

    const totalServingNow = db.prepare(`
      SELECT COUNT(*) as count FROM queue_entries
      WHERE status IN ('called', 'serving')
    `).get().count;

    const activeCounters = db.prepare(`
      SELECT COUNT(*) as count FROM counters WHERE is_active = 1
    `).get().count;

    const avgWaitRow = db.prepare(`
      SELECT AVG((strftime('%s', served_at) - strftime('%s', joined_at)) / 60.0) as avg_wait
      FROM queue_entries
      WHERE status = 'completed' AND served_at IS NOT NULL AND date(completed_at) = date('now')
    `).get();

    const avgServiceRow = db.prepare(`
      SELECT AVG((strftime('%s', completed_at) - strftime('%s', served_at)) / 60.0) as avg_service
      FROM queue_entries
      WHERE status = 'completed' AND served_at IS NOT NULL AND completed_at IS NOT NULL AND date(completed_at) = date('now')
    `).get();

    const services = db.prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM queue_entries q WHERE q.service_id = s.id AND q.status = 'waiting') as waiting_count,
        (SELECT COUNT(*) FROM queue_entries q WHERE q.service_id = s.id AND q.status IN ('called', 'serving')) as serving_count,
        (SELECT COUNT(*) FROM queue_entries q WHERE q.service_id = s.id AND q.status = 'completed' AND date(q.completed_at) = date('now')) as completed_today,
        (SELECT COUNT(*) FROM counters c WHERE c.service_id = s.id AND c.is_active = 1) as active_counters
      FROM services s
      ORDER BY s.id ASC
    `).all();

    res.json({
      metrics: {
        totalStudents,
        totalStaff,
        totalServedToday,
        totalWaitingNow,
        totalServingNow,
        activeCounters,
        avgWaitMins: avgWaitRow && avgWaitRow.avg_wait ? Math.round(avgWaitRow.avg_wait) : 7,
        avgServiceMins: avgServiceRow && avgServiceRow.avg_service ? Math.round(avgServiceRow.avg_service) : 9
      },
      services
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to load admin overview.' });
  }
});

// GET /api/admin/users - User management (Students, Staff, Admins)
router.get('/users', (req, res) => {
  try {
    const { role, search } = req.query;
    let sql = 'SELECT id, name, email, role, phone, student_id, created_at FROM users WHERE 1=1';
    const params = [];

    if (role && ['student', 'staff', 'admin'].includes(String(role).toLowerCase())) {
      sql += ' AND role = ?';
      params.push(String(role).toLowerCase());
    }

    if (search && String(search).trim().length > 0) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR student_id LIKE ?)';
      const s = `%${String(search).trim()}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY id DESC';
    const users = db.prepare(sql).all(...params);
    res.json({ users });
  } catch (err) {
    console.error('Admin fetch users error:', err);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// POST /api/admin/users - Create new user with specific role
router.post('/users', (req, res) => {
  try {
    const { name, email, password, role = 'student', student_id, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const validRole = ['student', 'staff', 'admin'].includes(role) ? role : 'student';
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, student_id, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), trimmedEmail, password_hash, validRole, student_id || null, phone || null);

    res.status(201).json({
      message: `User created successfully as ${validRole.toUpperCase()}.`,
      userId: Number(result.lastInsertRowid)
    });
  } catch (err) {
    console.error('Admin create user error:', err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// PUT /api/admin/users/:id/role - Update user role
router.put('/users/:id/role', (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;

    if (!['student', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be student, staff, or admin.' });
    }

    if (userId === req.user.id && role !== 'admin') {
      return res.status(400).json({ error: 'Admins cannot remove their own admin privileges.' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
    res.json({ message: `User role updated to ${role}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// GET /api/admin/students - Student roster with queue activity
router.get('/students', (req, res) => {
  try {
    const students = db.prepare(`
      SELECT u.id, u.name, u.email, u.student_id, u.phone, u.created_at,
        (SELECT COUNT(*) FROM queue_entries q WHERE q.user_id = u.id AND q.status IN ('waiting', 'called', 'serving')) as active_tokens_count,
        (SELECT COUNT(*) FROM queue_entries q WHERE q.user_id = u.id AND q.status = 'completed') as completed_tokens_count,
        (SELECT COUNT(*) FROM appointments a WHERE a.user_id = u.id AND a.status = 'confirmed') as active_appointments_count
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.id DESC
    `).all();

    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students roster.' });
  }
});

// GET /api/admin/staff - Staff members and counter assignments
router.get('/staff', (req, res) => {
  try {
    const staffMembers = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.created_at,
        c.id as counter_id, c.counter_number, c.name as counter_name,
        s.id as service_id, s.name as service_name, s.code as service_code,
        (SELECT COUNT(*) FROM queue_entries q WHERE q.counter_id = c.id AND q.status = 'completed' AND date(q.completed_at) = date('now')) as completed_today
      FROM users u
      LEFT JOIN counters c ON c.assigned_staff_id = u.id
      LEFT JOIN services s ON c.service_id = s.id
      WHERE u.role = 'staff'
      ORDER BY u.name ASC
    `).all();

    res.json({ staff: staffMembers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff members.' });
  }
});

// POST /api/admin/staff/assign-counter - Assign staff to counter
router.post('/staff/assign-counter', (req, res) => {
  try {
    const { staff_id, counter_id } = req.body;

    if (!staff_id || !counter_id) {
      return res.status(400).json({ error: 'staff_id and counter_id are required.' });
    }

    db.prepare('UPDATE counters SET assigned_staff_id = ? WHERE id = ?').run(Number(staff_id), Number(counter_id));
    res.json({ message: 'Staff member assigned to counter successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign staff to counter.' });
  }
});

// GET /api/admin/settings - System settings
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM system_settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve system settings.' });
  }
});

// PUT /api/admin/settings - Update system settings
router.put('/settings', (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required.' });
    }

    const upsert = db.prepare(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);

    for (const [key, value] of Object.entries(settings)) {
      upsert.run(String(key), String(value));
    }

    res.json({ message: 'System settings updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update system settings.' });
  }
});

// GET /api/admin/queues/:serviceId - Detailed queue entries for an operator desk
router.get('/queues/:serviceId', (req, res) => {
  try {
    const serviceId = Number(req.params.serviceId);
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    const counters = db.prepare('SELECT * FROM counters WHERE service_id = ? ORDER BY counter_number ASC').all(serviceId);

    const activeEntries = db.prepare(`
      SELECT q.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.student_id,
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
      SELECT q.*, u.name as user_name, u.student_id, c.counter_number
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
    console.error('Admin queues error:', err);
    res.status(500).json({ error: 'Failed to fetch queue desk.' });
  }
});

// POST /api/admin/queues/call-next - Admin call next token
router.post('/queues/call-next', (req, res) => {
  try {
    const { service_id, counter_id } = req.body;
    if (!service_id || !counter_id) {
      return res.status(400).json({ error: 'Both service_id and counter_id are required.' });
    }

    const counter = db.prepare('SELECT * FROM counters WHERE id = ? AND service_id = ?').get(counter_id, service_id);
    if (!counter) {
      return res.status(404).json({ error: 'Counter not found for this service.' });
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id);

    const nextToken = db.prepare(`
      SELECT q.*, u.name as user_name, u.email as user_email
      FROM queue_entries q
      JOIN users u ON q.user_id = u.id
      WHERE q.service_id = ? AND q.status = 'waiting'
      ORDER BY q.priority DESC, q.id ASC
      LIMIT 1
    `).get(service_id);

    if (!nextToken) {
      return res.status(404).json({ message: 'No more visitors waiting in queue for this service.' });
    }

    db.prepare(`
      UPDATE queue_entries
      SET status = 'called', counter_id = ?, called_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(counter_id, nextToken.id);

    const notifMsg = `Token ${nextToken.token_number}: Please proceed immediately to ${counter.name} (${service.name})!`;
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Now Being Called!', ?, 'call', ?)
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

    const calledPayload = {
      ...nextToken,
      counter_id,
      counter_number: counter.counter_number,
      counter_name: counter.name
    };

    res.json({
      message: `Called token ${nextToken.token_number} to Counter ${counter.counter_number}.`,
      calledToken: calledPayload,
      token: calledPayload
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to call next token.' });
  }
});

// POST /api/admin/queues/:id/status - Update token status
router.post('/queues/:id/status', (req, res) => {
  try {
    const tokenId = Number(req.params.id);
    const { status, counter_id } = req.body;

    if (!['serving', 'completed', 'skipped', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status transition.' });
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
    } else if (status === 'completed' || status === 'cancelled' || status === 'skipped') {
      sql += ', completed_at = CURRENT_TIMESTAMP';
    }

    sql += ' WHERE id = ?';
    params.push(tokenId);

    db.prepare(sql).run(...params);

    if (status === 'completed') {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'Service Completed — How was your experience?', ?, 'complete', ?)
      `).run(
        token.user_id,
        `Your consultation for token ${token.token_number} has concluded. Rate your experience!`,
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

    res.json({ message: `Token ${token.token_number} marked as ${status}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update token status.' });
  }
});

// POST /api/admin/queues/:id/recall - Re-announce/re-call token
router.post('/queues/:id/recall', (req, res) => {
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

    res.json({ message: `Token ${entry.token_number} recalled successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to recall token.' });
  }
});

export default router;
