/* ============================================================
   StudyBalance — Auth Middleware
   backend/middleware/auth.js

   Verifies the JWT from the Authorization header and attaches
   req.user = { userId, role } for downstream route handlers.
   ============================================================ */

'use strict';

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

/**
 * requireAuth — rejects requests with no valid JWT.
 * Attaches req.user = { userId, role } on success.
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

/**
 * requireAdmin — use after requireAuth.
 * Rejects non-admin users with 403.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
