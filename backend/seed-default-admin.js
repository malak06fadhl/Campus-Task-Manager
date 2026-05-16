/* ============================================================
   StudyBalance — Default Admin Seeder
   backend/seed-default-admin.js

   Automatically creates a default admin account for local
   development if it doesn't already exist.
   
   This runs on every server start in development mode.
   ============================================================ */

'use strict';

const bcrypt = require('bcrypt');
const db     = require('./db');

const SALT_ROUNDS = 10;

const DEFAULT_ADMIN = {
  id: 'admin-default',
  full_name: 'Administrator',
  email: 'admin@studybalance.com',
  password: 'admin123',
  role: 'admin'
};

/**
 * Ensures the default admin account exists in the database.
 * Safe to run multiple times — uses INSERT OR IGNORE.
 */
async function ensureDefaultAdmin() {
  try {
    // Check if admin already exists
    const existing = await db.get(
      'SELECT id FROM users WHERE email = ?',
      [DEFAULT_ADMIN.email]
    );

    if (existing) {
      console.log('✓ Default admin account already exists');
      return;
    }

    // Create the admin account
    const hash = await bcrypt.hash(DEFAULT_ADMIN.password, SALT_ROUNDS);
    const result = await db.run(
      `INSERT OR IGNORE INTO users (id, full_name, email, password_hash, role, banned)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [DEFAULT_ADMIN.id, DEFAULT_ADMIN.full_name, DEFAULT_ADMIN.email, hash, DEFAULT_ADMIN.role]
    );

    if (result.changes > 0) {
      console.log('✓ Default admin account created:', DEFAULT_ADMIN.email);
    } else {
      console.log('✓ Default admin account already exists');
    }
  } catch (err) {
    console.error('⚠ Failed to create default admin account:', err.message);
    // Don't throw — allow server to start even if seeding fails
  }
}

module.exports = { ensureDefaultAdmin };
