/* ============================================================
   StudyBalance — Express Server
   backend/server.js
   ============================================================ */

'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');

/* ── Init DB (runs schema on first start) ── */
const db     = require('./db');
const config = require('./config');
const { ensureDefaultAdmin } = require('./seed-default-admin');

const app  = express();
const PORT = config.PORT;

/* ── Middleware ── */
app.use(cors({
  origin: config.NODE_ENV === 'production' 
    ? (config.CORS_ORIGIN !== '*' ? config.CORS_ORIGIN : config.FRONTEND_URL)
    : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

/* ── Health check ── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'StudyBalance API is running' });
});

/* ── Auth routes ── */
app.use('/api', require('./routes/auth'));

/* ── Courses routes ── */
app.use('/api', require('./routes/courses'));

/* ── Tasks routes ── */
app.use('/api', require('./routes/tasks'));

/* ── Admin routes ── */
app.use('/api/admin', require('./routes/admin'));

/* ── AI Chat routes ── */
app.use('/api', require('./routes/ai-chat'));

/* ── 404 handler ── */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/* ── Global error handler ── */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

/* ── Start after DB schema is ready ── */
db.ready.then(async () => {
  // Ensure default admin exists (local development only)
  if (config.NODE_ENV !== 'production') {
    await ensureDefaultAdmin();
  }

  app.listen(PORT, () => {
    console.log(`StudyBalance API running at http://localhost:${PORT}`);
    console.log(`Health:    GET  http://localhost:${PORT}/api/health`);
    console.log(`Register:  POST http://localhost:${PORT}/api/register`);
    console.log(`Login:     POST http://localhost:${PORT}/api/login`);
  });
}).catch(err => {
  console.error('Database failed to initialise:', err);
  process.exit(1);
});
