/* ============================================================
   StudyBalance — Auth Routes
   backend/routes/auth.js

   POST /api/register   — create a new student account
   POST /api/login      — authenticate and return a JWT
   ============================================================ */

'use strict';

const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { JWT_SECRET, SALT_ROUNDS } = require('../config');

const router = express.Router();

/* ── Helpers ── */

/** Strip password_hash before sending a user object to the client */
function safeUser(row) {
  if (!row) return null;
  const { password_hash, ...safe } = row;
  return safe;
}

/** Generate a UUID-style id without external deps */
function genId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/* ── POST /api/register ─────────────────────────────────── */
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    /* ── Field validation ── */
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalEmail = email.trim().toLowerCase();

    /* ── Duplicate email check ── */
    const existing = await db.get(
      'SELECT id FROM users WHERE LOWER(email) = ?',
      [normalEmail]
    );
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    /* ── Hash password and insert ── */
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const id            = genId();

    await db.run(
      `INSERT INTO users (id, full_name, email, password_hash, role, banned)
       VALUES (?, ?, ?, ?, 'student', 0)`,
      [id, full_name.trim(), normalEmail, password_hash]
    );

    /* ── Fetch the created row ── */
    const newUser = await db.get('SELECT * FROM users WHERE id = ?', [id]);

    /* ── Issue JWT ── */
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: safeUser(newUser)
    });

  } catch (err) {
    console.error('POST /api/register error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/* ── POST /api/login ────────────────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    /* ── Field validation ── */
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const normalEmail = email.trim().toLowerCase();

    /* ── Look up user ── */
    const user = await db.get(
      'SELECT * FROM users WHERE LOWER(email) = ?',
      [normalEmail]
    );

    if (!user) {
      return res.status(401).json({ error: 'No account found with that email address.' });
    }

    /* ── Check password ── */
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    /* ── Check banned ── */
    if (user.banned) {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    /* ── Issue JWT ── */
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: safeUser(user)
    });

  } catch (err) {
    console.error('POST /api/login error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

module.exports = router;
