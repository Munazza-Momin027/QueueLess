import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, email, password, student_id, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check duplicate
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    // RBAC Security: Enforce student role on public registration (prevent privilege escalation)
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, student_id, phone)
      VALUES (?, ?, ?, 'student', ?, ?)
    `).run(name.trim(), trimmedEmail, password_hash, student_id ? student_id.trim() : null, phone ? phone.trim() : null);

    const user = {
      id: Number(result.lastInsertRowid),
      name: name.trim(),
      email: trimmedEmail,
      role: 'student',
      student_id: student_id || null,
      phone: phone || null
    };

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful! Welcome to QueueLess.',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userRole = (user.role === 'user' ? 'student' : user.role).toLowerCase();
    const token = jwt.sign({ id: user.id, role: userRole }, JWT_SECRET, { expiresIn: '7d' });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: userRole,
      student_id: user.student_id,
      phone: user.phone
    };

    res.json({
      message: 'Login successful!',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal login error. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, phone, student_id } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name cannot be empty.' });
    }

    db.prepare(`
      UPDATE users SET name = ?, phone = ?, student_id = ?
      WHERE id = ?
    `).run(name.trim(), phone ? phone.trim() : null, student_id ? student_id.trim() : null, req.user.id);

    const updated = db.prepare('SELECT id, name, email, role, phone, student_id FROM users WHERE id = ?').get(req.user.id);
    if (updated.role === 'user') updated.role = 'student';
    res.json({ message: 'Profile updated successfully.', user: updated });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// POST /api/auth/demo-login (Quick 1-click test role login for judges/testing)
router.post('/demo-login', (req, res) => {
  try {
    const { role } = req.body; // 'admin', 'staff', 'student'
    const reqRole = (role || 'student').toLowerCase();
    let targetEmail = 'student@queueless.edu';
    if (reqRole === 'admin') targetEmail = 'admin@queueless.edu';
    else if (reqRole === 'staff') targetEmail = 'staff@queueless.edu';

    const user = db.prepare('SELECT id, name, email, role, phone, student_id FROM users WHERE email = ?').get(targetEmail);
    if (!user) {
      return res.status(404).json({ error: 'Demo account not found.' });
    }

    const userRole = (user.role === 'user' ? 'student' : user.role).toLowerCase();
    user.role = userRole;

    const token = jwt.sign({ id: user.id, role: userRole }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: `Switched to ${userRole.toUpperCase()} demo role (${user.name})`,
      token,
      user
    });
  } catch (err) {
    res.status(500).json({ error: 'Demo login failed.' });
  }
});

export default router;
