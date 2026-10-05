import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

// Create API router
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/student', studentRoutes);
apiRouter.use('/staff', staffRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/services', servicesRoutes);
apiRouter.use('/queues', queuesRoutes);
apiRouter.use('/appointments', appointmentsRoutes);
apiRouter.use('/notifications', notificationsRoutes);
apiRouter.use('/feedback', feedbackRoutes);
apiRouter.use('/analytics', analyticsRoutes);

// Root API status endpoint
const statusResponse = (req, res) => {
  res.json({
    status: 'healthy',
    system: 'QueueLess API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
};

apiRouter.get('/', statusResponse);
apiRouter.get('/health', statusResponse);

// Mount router on both /api (standard REST path) and / (fallback if prefix is stripped in serverless context)
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global 404 handler for API routes
app.use((req, res) => {
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

const isVercel = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);

// Only listen when running directly as standalone Node.js process
const isDirectRun = process.argv[1] && (
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
  process.argv[1].endsWith('server/index.js') ||
  process.argv[1].endsWith('server\\index.js')
);

if (isDirectRun && !isVercel) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 QueueLess API Server running on port ${PORT}`);
    console.log(`📡 Real-time SSE endpoint: http://localhost:${PORT}/api/queues/stream`);
    console.log(`====================================================`);
  });
}

export default app;
