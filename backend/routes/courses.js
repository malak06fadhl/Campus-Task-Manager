/* ============================================================
   StudyBalance — Courses Routes
   backend/routes/courses.js

   GET    /api/courses        list courses for logged-in user
   POST   /api/courses        create a course
   PUT    /api/courses/:id    update a course (owner only)
   DELETE /api/courses/:id    delete a course + its tasks (owner only)
   ============================================================ */

'use strict';

const express = require('express');
const db      = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/* All routes require a valid JWT */
router.use(requireAuth);

/* ── Helper: generate a UUID ── */
function genId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/* ── Helper: verify course belongs to requesting user ── */
async function ownCourse(courseId, userId, res) {
  const course = await db.get(
    'SELECT id, user_id FROM courses WHERE id = ?',
    [courseId]
  );
  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return null;
  }
  if (course.user_id !== userId) {
    res.status(403).json({ error: 'You do not have permission to modify this course.' });
    return null;
  }
  return course;
}

/* ── GET /api/courses ───────────────────────────────────── */
router.get('/courses', async (req, res) => {
  try {
    const courses = await db.all(
      `SELECT id, user_id, name, code, instructor, credits, progress, created_at
       FROM courses
       WHERE user_id = ?
       ORDER BY created_at ASC`,
      [req.user.userId]
    );
    res.json({ courses });
  } catch (err) {
    console.error('GET /api/courses error:', err);
    res.status(500).json({ error: 'Failed to load courses.' });
  }
});

/* ── POST /api/courses ──────────────────────────────────── */
router.post('/courses', async (req, res) => {
  try {
    const { name, code, instructor, credits, progress } = req.body;

    /* Validation */
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Course name is required.' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Course code is required.' });
    }
    const creditsNum = parseInt(credits, 10);
    if (!creditsNum || creditsNum < 1 || creditsNum > 12) {
      return res.status(400).json({ error: 'Credit hours must be between 1 and 12.' });
    }

    const id          = genId();
    const progressNum = Math.min(100, Math.max(0, parseInt(progress, 10) || 0));

    await db.run(
      `INSERT INTO courses (id, user_id, name, code, instructor, credits, progress)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.userId, name.trim(), code.trim(),
       (instructor || '').trim(), creditsNum, progressNum]
    );

    const course = await db.get('SELECT * FROM courses WHERE id = ?', [id]);
    res.status(201).json({ course });
  } catch (err) {
    console.error('POST /api/courses error:', err);
    res.status(500).json({ error: 'Failed to create course.' });
  }
});

/* ── PUT /api/courses/:id ───────────────────────────────── */
router.put('/courses/:id', async (req, res) => {
  try {
    const owned = await ownCourse(req.params.id, req.user.userId, res);
    if (!owned) return;

    const { name, code, instructor, credits, progress } = req.body;

    /* Validation */
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Course name is required.' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Course code is required.' });
    }
    const creditsNum = parseInt(credits, 10);
    if (!creditsNum || creditsNum < 1 || creditsNum > 12) {
      return res.status(400).json({ error: 'Credit hours must be between 1 and 12.' });
    }

    const progressNum = Math.min(100, Math.max(0, parseInt(progress, 10) || 0));

    await db.run(
      `UPDATE courses
       SET name = ?, code = ?, instructor = ?, credits = ?, progress = ?
       WHERE id = ?`,
      [name.trim(), code.trim(), (instructor || '').trim(),
       creditsNum, progressNum, req.params.id]
    );

    const updated = await db.get('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    res.json({ course: updated });
  } catch (err) {
    console.error('PUT /api/courses/:id error:', err);
    res.status(500).json({ error: 'Failed to update course.' });
  }
});

/* ── DELETE /api/courses/:id ────────────────────────────── */
router.delete('/courses/:id', async (req, res) => {
  try {
    const owned = await ownCourse(req.params.id, req.user.userId, res);
    if (!owned) return;

    /* Cascade: nullify course_id on linked tasks (FK is ON DELETE SET NULL) */
    /* SQLite handles this automatically via the FK constraint in schema.sql  */
    await db.run('DELETE FROM courses WHERE id = ?', [req.params.id]);

    res.json({ message: 'Course deleted successfully.' });
  } catch (err) {
    console.error('DELETE /api/courses/:id error:', err);
    res.status(500).json({ error: 'Failed to delete course.' });
  }
});

module.exports = router;
