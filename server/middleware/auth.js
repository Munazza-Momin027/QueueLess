import jwt from 'jsonwebtoken';
import { db } from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'queueless_super_secret_jwt_key_2026_webnova';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired session token. Please sign in again.' });
    }

    // Verify user still exists in database
    const user = db.prepare('SELECT id, name, email, role, phone, student_id FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    if (user.role === 'user') user.role = 'student';
    req.user = user;
    next();
  });
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err && decoded) {
        const user = db.prepare('SELECT id, name, email, role, phone, student_id FROM users WHERE id = ?').get(decoded.id);
        if (user) {
          if (user.role === 'user') user.role = 'student';
          req.user = user;
        }
      }
      next();
    });
  } else {
    next();
  }
}

export function requireRole(...roles) {
  const allowed = roles.flat().map(r => r.toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    const current = (req.user.role || '').toLowerCase();
    const normalized = current === 'user' ? 'student' : current;
    if (!allowed.includes(normalized)) {
      return res.status(403).json({
        error: `Forbidden: Access denied. Required role: ${allowed.join(' or ')}. Your role: ${normalized}`,
        requiredRoles: allowed,
        currentRole: normalized
      });
    }
    next();
  };
}
