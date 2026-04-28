/* ============================================================
   StudyBalance — Admin Routes
   backend/routes/admin.js

   GET   /api/admin/users            list all students with counts
   PATCH /api/admin/users/:id/ban    toggle ban on a student
   GET   /api/admin/tasks            list all tasks across all users
   ============================================================ */

'use strict';

const express = require('express');
const db      = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/* All admin routes require a valid JWT AND admin role */
router.use(requireAuth);
router.use(requireAdmin);

/* ── GET /api/admin/users ───────────────────────────────── */
router.get('/users', async (req, res) => {
  try {
    /* Fetch all non-admin users with their course and task counts */
    const users = await db.all(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.role,
         u.banned,
         u.created_at,
         COUNT(DISTINCT c.id) AS total_courses,
         COUNT(DISTINCT t.id) AS total_tasks
       FROM users u
       LEFT JOIN courses c ON c.user_id = u.id
       LEFT JOIN tasks   t ON t.user_id = u.id
       WHERE u.role = 'student'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    res.json({ users });
  } catch (err) {
    console.error('GET /api/admin/users error:', err);
    res.status(500).json({ error: 'Failed to load users.' });
  }
});

/* ── PATCH /api/admin/users/:id/ban ────────────────────── */
router.patch('/users/:id/ban', async (req, res) => {
  try {
    const target = await db.get(
      'SELECT id, role, banned FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (target.role === 'admin') {
      return res.status(403).json({ error: 'Admin accounts cannot be banned.' });
    }

    const newBanned = target.banned ? 0 : 1;
    await db.run(
      'UPDATE users SET banned = ? WHERE id = ?',
      [newBanned, req.params.id]
    );

    const updated = await db.get(
      'SELECT id, full_name, email, role, banned, created_at FROM users WHERE id = ?',
      [req.params.id]
    );

    res.json({
      message: newBanned ? 'User banned successfully.' : 'User unbanned successfully.',
      user: updated
    });
  } catch (err) {
    console.error('PATCH /api/admin/users/:id/ban error:', err);
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});

/* ── GET /api/admin/tasks ───────────────────────────────── */
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await db.all(
      `SELECT
         t.id,
         t.title,
         t.priority,
         t.status,
         t.deadline,
         t.course_name,
         c.code        AS course_code,
         u.id          AS student_id,
         u.full_name   AS student_name,
         u.email       AS student_email
       FROM tasks t
       LEFT JOIN users   u ON u.id = t.user_id
       LEFT JOIN courses c ON c.id = t.course_id
       ORDER BY t.deadline ASC, t.created_at ASC`
    );
    res.json({ tasks });
  } catch (err) {
    console.error('GET /api/admin/tasks error:', err);
    res.status(500).json({ error: 'Failed to load task records.' });
  }
});

module.exports = router;
