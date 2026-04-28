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

const app  = express();
const PORT = config.PORT;

/* ── Middleware ── */
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
db.ready.then(() => {
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
