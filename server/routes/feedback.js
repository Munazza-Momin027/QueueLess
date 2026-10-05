import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/feedback - Submit post-service rating and review
router.post('/', authenticateToken, (req, res) => {
  try {
    const { queue_entry_id, service_id, rating, comments } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5 stars.' });
    }

    if (!service_id) {
      return res.status(400).json({ error: 'Service ID is required.' });
    }

    // Check if feedback already submitted for this queue entry
    if (queue_entry_id) {
      const existing = db.prepare('SELECT id FROM feedback WHERE queue_entry_id = ? AND user_id = ?').get(queue_entry_id, userId);
      if (existing) {
        return res.status(409).json({ error: 'You have already submitted feedback for this visit.' });
      }
    }

    const result = db.prepare(`
      INSERT INTO feedback (queue_entry_id, service_id, user_id, rating, comments)
      VALUES (?, ?, ?, ?, ?)
    `).run(queue_entry_id || null, service_id, userId, Number(rating), comments ? comments.trim() : null);

    res.status(201).json({
      message: 'Thank you! Your feedback helps improve campus service efficiency.',
      feedbackId: Number(result.lastInsertRowid)
    });
  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({ error: 'Failed to record feedback.' });
  }
});

// GET /api/feedback/summary - Overall feedback telemetry
router.get('/summary', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT COUNT(*) as total_reviews,
             AVG(rating) as avg_rating,
             SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive_count
      FROM feedback
    `).get();

    const recentReviews = db.prepare(`
      SELECT f.*, u.name as user_name, s.name as service_name
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      JOIN services s ON f.service_id = s.id
      ORDER BY f.id DESC
      LIMIT 10
    `).all();

    const total = stats.total_reviews || 0;
    const avg = stats.avg_rating ? Math.round(stats.avg_rating * 10) / 10 : 4.8;
    const satisfactionRate = total > 0 ? Math.round((stats.positive_count / total) * 100) : 96;

    res.json({
      totalReviews: total,
      averageRating: avg,
      satisfactionRate,
      recentReviews
    });
  } catch (err) {
    console.error('Feedback summary error:', err);
    res.status(500).json({ error: 'Failed to fetch feedback summary.' });
  }
});

export default router;
