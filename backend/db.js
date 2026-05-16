/* ============================================================
   StudyBalance — Database Module
   backend/db.js
   
   Supports both SQLite (development) and PostgreSQL (production)
   based on DATABASE_URL environment variable.
   ============================================================ */

'use strict';

const path = require('path');
const fs   = require('fs');

// Determine database type from environment
const DATABASE_URL = process.env.DATABASE_URL;
const USE_POSTGRES = DATABASE_URL && DATABASE_URL.startsWith('postgres');

const DB_PATH     = path.join(__dirname, 'studybalance.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

/* ── Initialize database connection based on environment ── */
let dbConnection;
let ready;

if (USE_POSTGRES) {
  // PostgreSQL setup for production
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  ready = (async () => {
    try {
      // Test connection
      const client = await pool.connect();
      
      // Apply schema (PostgreSQL version)
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
      
      // Convert SQLite schema to PostgreSQL
      const pgSchema = schema
        .replace(/TEXT PRIMARY KEY/g, 'TEXT PRIMARY KEY')
        .replace(/INTEGER NOT NULL DEFAULT 0/g, 'INTEGER NOT NULL DEFAULT 0')
        .replace(/strftime\('%Y-%m-%dT%H:%M:%SZ', 'now'\)/g, "NOW()")
        .replace(/COLLATE NOCASE/g, '');
      
      const stripped = pgSchema
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');
      
      const stmts = stripped
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of stmts) {
        await client.query(stmt);
      }

      client.release();
      console.log('PostgreSQL database ready');
      return pool;
    } catch (err) {
      console.error('PostgreSQL connection error:', err);
      throw err;
    }
  })();

  dbConnection = pool;

} else {
  // SQLite setup for development
  const sqlite3 = require('sqlite3').verbose();

  ready = new Promise((resolve, reject) => {
    const rawDb = new sqlite3.Database(DB_PATH, async (openErr) => {
      if (openErr) { reject(openErr); return; }

      /* Promisified run scoped to this rawDb instance */
      function exec(sql, params) {
        return new Promise((res, rej) => {
          rawDb.run(sql, params || [], function (err) {
            if (err) rej(err); else res({ lastID: this.lastID, changes: this.changes });
          });
        });
      }

      try {
        await exec('PRAGMA journal_mode = WAL');
        await exec('PRAGMA foreign_keys = ON');

        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        /* Strip comment lines first, then split on semicolons */
        const stripped = schema
          .split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n');
        const stmts = stripped
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const stmt of stmts) {
          await exec(stmt);
        }

        console.log('SQLite database ready:', DB_PATH);
        resolve(rawDb);
      } catch (err) {
        reject(err);
      }
    });
  });

  dbConnection = null; // Will be set after ready resolves
}

/* ── Public helpers — wait for ready, then use the db handle ── */

async function run(sql, params) {
  const db = await ready;
  
  if (USE_POSTGRES) {
    // PostgreSQL: convert ? placeholders to $1, $2, etc.
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await db.query(pgSql, params || []);
    return { 
      lastID: result.rows[0]?.id || null, 
      changes: result.rowCount 
    };
  } else {
    // SQLite
    return new Promise((resolve, reject) => {
      db.run(sql, params || [], function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
}

async function get(sql, params) {
  const db = await ready;
  
  if (USE_POSTGRES) {
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await db.query(pgSql, params || []);
    return result.rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      db.get(sql, params || [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

async function all(sql, params) {
  const db = await ready;
  
  if (USE_POSTGRES) {
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await db.query(pgSql, params || []);
    return result.rows || [];
  } else {
    return new Promise((resolve, reject) => {
      db.all(sql, params || [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}

module.exports = { run, get, all, ready };
