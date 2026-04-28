/* ============================================================
   StudyBalance — Tasks Routes
   backend/routes/tasks.js

   GET    /api/tasks        list tasks for logged-in user
   POST   /api/tasks        create a task
   PUT    /api/tasks/:id    update a task (owner only)
   DELETE /api/tasks/:id    delete a task (owner only)
   ============================================================ */

'use strict';

const express = require('express');
const db      = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/* All routes require a valid JWT */
router.use(requireAuth);

/* ── Constants ── */
const VALID_PRIORITIES = ['high', 'medium', 'low'];
const VALID_STATUSES   = ['pending', 'inprogress', 'completed'];

/* ── Helper: generate a UUID ── */
function genId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/* ── Helper: verify task belongs to requesting user ── */
async function ownTask(taskId, userId, res) {
  const task = await db.get(
    'SELECT id, user_id FROM tasks WHERE id = ?',
    [taskId]
  );
  if (!task) {
    res.status(404).json({ error: 'Task not found.' });
    return null;
  }
  if (task.user_id !== userId) {
    res.status(403).json({ error: 'You do not have permission to modify this task.' });
    return null;
  }
  return task;
}

/* ── Helper: enrich task row with course name/code ── */
async function enrichTask(task) {
  if (!task.course_id) return task;
  const course = await db.get(
    'SELECT name, code FROM courses WHERE id = ?',
    [task.course_id]
  );
  return Object.assign({}, task, {
    course_name: course ? course.name : (task.course_name || ''),
    course_code: course ? course.code : ''
  });
}

/* ── GET /api/tasks ─────────────────────────────────────── */
router.get('/tasks', async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT t.id, t.user_id, t.course_id, t.course_name, t.title,
              t.description, t.priority, t.status, t.deadline, t.created_at,
              c.name  AS course_name,
              c.code  AS course_code
       FROM   tasks t
       LEFT JOIN courses c ON c.id = t.course_id
       WHERE  t.user_id = ?
       ORDER  BY t.deadline ASC, t.created_at ASC`,
      [req.user.userId]
    );
    res.json({ tasks: rows });
  } catch (err) {
    console.error('GET /api/tasks error:', err);
    res.status(500).json({ error: 'Failed to load tasks.' });
  }
});

/* ── POST /api/tasks ────────────────────────────────────── */
router.post('/tasks', async (req, res) => {
  try {
    const { title, course_id, priority, status, deadline, description } = req.body;

    /* Validation */
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }
    if (!course_id) {
      return res.status(400).json({ error: 'Please select a course.' });
    }
    if (!priority || !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'Priority must be high, medium, or low.' });
    }
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status must be pending, inprogress, or completed.' });
    }
    if (!deadline) {
      return res.status(400).json({ error: 'Please set a deadline.' });
    }

    /* Verify the course belongs to this user */
    const course = await db.get(
      'SELECT id, name, code FROM courses WHERE id = ? AND user_id = ?',
      [course_id, req.user.userId]
    );
    if (!course) {
      return res.status(400).json({ error: 'Selected course not found.' });
    }

    const id = genId();

    await db.run(
      `INSERT INTO tasks
         (id, user_id, course_id, course_name, title, description, priority, status, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.userId, course_id, course.name,
       title.trim(), (description || '').trim(), priority, status, deadline]
    );

    /* Return the created task with course info */
    const created = await db.get(
      `SELECT t.*, c.name AS course_name, c.code AS course_code
       FROM tasks t LEFT JOIN courses c ON c.id = t.course_id
       WHERE t.id = ?`,
      [id]
    );
    res.status(201).json({ task: created });
  } catch (err) {
    console.error('POST /api/tasks error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

/* ── PUT /api/tasks/:id ─────────────────────────────────── */
router.put('/tasks/:id', async (req, res) => {
  try {
    const owned = await ownTask(req.params.id, req.user.userId, res);
    if (!owned) return;

    const { title, course_id, priority, status, deadline, description } = req.body;

    /* Validation */
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }
    if (!course_id) {
      return res.status(400).json({ error: 'Please select a course.' });
    }
    if (!priority || !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'Priority must be high, medium, or low.' });
    }
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status must be pending, inprogress, or completed.' });
    }
    if (!deadline) {
      return res.status(400).json({ error: 'Please set a deadline.' });
    }

    /* Verify the course belongs to this user */
    const course = await db.get(
      'SELECT id, name, code FROM courses WHERE id = ? AND user_id = ?',
      [course_id, req.user.userId]
    );
    if (!course) {
      return res.status(400).json({ error: 'Selected course not found.' });
    }

    await db.run(
      `UPDATE tasks
       SET course_id = ?, course_name = ?, title = ?, description = ?,
           priority = ?, status = ?, deadline = ?
       WHERE id = ?`,
      [course_id, course.name, title.trim(), (description || '').trim(),
       priority, status, deadline, req.params.id]
    );

    const updated = await db.get(
      `SELECT t.*, c.name AS course_name, c.code AS course_code
       FROM tasks t LEFT JOIN courses c ON c.id = t.course_id
       WHERE t.id = ?`,
      [req.params.id]
    );
    res.json({ task: updated });
  } catch (err) {
    console.error('PUT /api/tasks/:id error:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

/* ── DELETE /api/tasks/:id ──────────────────────────────── */
router.delete('/tasks/:id', async (req, res) => {
  try {
    const owned = await ownTask(req.params.id, req.user.userId, res);
    if (!owned) return;

    await db.run('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('DELETE /api/tasks/:id error:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
