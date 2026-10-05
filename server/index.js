import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';

// Route handlers
import authRoutes from './routes/auth.js';
import servicesRoutes from './routes/services.js';
import queuesRoutes from './routes/queues.js';
import studentRoutes from './routes/student.js';
import staffRoutes from './routes/staff.js';
import adminRoutes from './routes/admin.js';
import appointmentsRoutes from './routes/appointments.js';
import notificationsRoutes from './routes/notifications.js';
import feedbackRoutes from './routes/feedback.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

// Initialize SQLite database and baseline seed
initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/queues', queuesRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'QueueLess API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Global 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    error: 'An internal server error occurred.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 QueueLess API Server running on port ${PORT}`);
  console.log(`📡 Real-time SSE endpoint: http://localhost:${PORT}/api/queues/stream`);
  console.log(`====================================================`);
});
