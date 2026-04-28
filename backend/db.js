/* ============================================================
   StudyBalance — Database Module
   backend/db.js
   ============================================================ */

'use strict';

const path    = require('path');
const fs      = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH     = path.join(__dirname, 'studybalance.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

/* ── ready: resolves once the DB is open AND schema is applied ── */
const ready = new Promise((resolve, reject) => {

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

      console.log('Database ready:', DB_PATH);
      resolve(rawDb);          // resolve with the open db handle
    } catch (err) {
      reject(err);
    }
  });
});

/* ── Public helpers — wait for ready, then use the db handle ── */

async function run(sql, params) {
  const db = await ready;
  return new Promise((resolve, reject) => {
    db.run(sql, params || [], function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

async function get(sql, params) {
  const db = await ready;
  return new Promise((resolve, reject) => {
    db.get(sql, params || [], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function all(sql, params) {
  const db = await ready;
  return new Promise((resolve, reject) => {
    db.all(sql, params || [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

module.exports = { run, get, all, ready };
