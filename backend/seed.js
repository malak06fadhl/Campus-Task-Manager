/* ============================================================
   StudyBalance — Database Seed Script
   backend/seed.js

   Populates demo accounts and sample data.
   Safe to re-run — uses INSERT OR IGNORE so existing rows
   are never overwritten.

   Usage:
     node seed.js
   ============================================================ */

'use strict';

const bcrypt = require('bcrypt');
const db     = require('./db');

const SALT_ROUNDS = 10;

function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/* Wait for db.js to finish applying the schema before inserting */
async function seed() {
  /* Wait for schema to be fully applied */
  await db.ready;
  console.log('Seeding demo data…\n');

  /* ── 1. Users ── */
  const demoUsers = [
    { id: 'u1', full_name: 'Alex Johnson',  email: 'alex@email.com',          password: 'pass123',  role: 'student' },
    { id: 'u2', full_name: 'John Doe',      email: 'john@email.com',          password: 'pass123',  role: 'student' },
    { id: 'u0', full_name: 'Administrator', email: 'admin@studybalance.com',  password: 'admin123', role: 'admin'   }
  ];

  for (const u of demoUsers) {
    const hash   = await bcrypt.hash(u.password, SALT_ROUNDS);
    const result = await db.run(
      `INSERT OR IGNORE INTO users (id, full_name, email, password_hash, role, banned)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [u.id, u.full_name, u.email, hash, u.role]
    );
    const label = result.changes > 0 ? 'created' : 'skipped (exists)';
    console.log(`  User ${label}: ${u.email}`);
  }

  /* ── 2. Courses ── */
  const demoCourses = [
    { id: 'c1', user_id: 'u1', name: 'Software Engineering', code: 'SE201',   instructor: 'Dr. Smith',  credits: 4, progress: 67 },
    { id: 'c2', user_id: 'u1', name: 'Database Systems',     code: 'CS301',   instructor: 'Dr. Lee',    credits: 3, progress: 50 },
    { id: 'c3', user_id: 'u1', name: 'Discrete Mathematics', code: 'MATH105', instructor: 'Dr. Patel',  credits: 3, progress: 40 },
    { id: 'c4', user_id: 'u2', name: 'Web Development',      code: 'WD101',   instructor: 'Dr. Brown',  credits: 3, progress: 75 },
    { id: 'c5', user_id: 'u2', name: 'Operating Systems',    code: 'CS401',   instructor: 'Dr. Garcia', credits: 4, progress: 30 },
    { id: 'c6', user_id: 'u2', name: 'Computer Networks',    code: 'CN301',   instructor: 'Dr. Kim',    credits: 3, progress: 55 }
  ];

  for (const c of demoCourses) {
    const result = await db.run(
      `INSERT OR IGNORE INTO courses (id, user_id, name, code, instructor, credits, progress)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.user_id, c.name, c.code, c.instructor, c.credits, c.progress]
    );
    const label = result.changes > 0 ? 'created' : 'skipped (exists)';
    console.log(`  Course ${label}: ${c.name}`);
  }

  /* ── 3. Tasks ── */
  const demoTasks = [
    { id: 't1',  user_id: 'u1', course_id: 'c1', course_name: 'Software Engineering', title: 'Project Proposal',          deadline: offsetDate(1),  priority: 'high',   status: 'pending',    description: '' },
    { id: 't2',  user_id: 'u1', course_id: 'c2', course_name: 'Database Systems',     title: 'Database Design ERD',       deadline: offsetDate(2),  priority: 'high',   status: 'inprogress', description: '' },
    { id: 't3',  user_id: 'u1', course_id: 'c3', course_name: 'Discrete Mathematics', title: 'Problem Set 3',             deadline: offsetDate(5),  priority: 'medium', status: 'pending',    description: '' },
    { id: 't4',  user_id: 'u1', course_id: 'c1', course_name: 'Software Engineering', title: 'Sprint Review Slides',      deadline: offsetDate(-3), priority: 'medium', status: 'completed',  description: '' },
    { id: 't5',  user_id: 'u1', course_id: 'c2', course_name: 'Database Systems',     title: 'SQL Query Assignment',      deadline: offsetDate(-5), priority: 'low',    status: 'completed',  description: '' },
    { id: 't6',  user_id: 'u1', course_id: 'c3', course_name: 'Discrete Mathematics', title: 'Research Paper Draft',      deadline: offsetDate(7),  priority: 'medium', status: 'pending',    description: '' },
    { id: 't7',  user_id: 'u1', course_id: 'c1', course_name: 'Software Engineering', title: 'Unit Testing Report',       deadline: offsetDate(1),  priority: 'high',   status: 'pending',    description: '' },
    { id: 't8',  user_id: 'u1', course_id: 'c2', course_name: 'Database Systems',     title: 'ER Diagram Revision',       deadline: offsetDate(4),  priority: 'low',    status: 'inprogress', description: '' },
    { id: 't9',  user_id: 'u2', course_id: 'c4', course_name: 'Web Development',      title: 'Responsive Portfolio Page', deadline: offsetDate(3),  priority: 'high',   status: 'inprogress', description: '' },
    { id: 't10', user_id: 'u2', course_id: 'c5', course_name: 'Operating Systems',    title: 'Process Scheduling Report', deadline: offsetDate(6),  priority: 'medium', status: 'pending',    description: '' },
    { id: 't11', user_id: 'u2', course_id: 'c6', course_name: 'Computer Networks',    title: 'Network Topology Diagram',  deadline: offsetDate(-2), priority: 'low',    status: 'completed',  description: '' },
    { id: 't12', user_id: 'u2', course_id: 'c4', course_name: 'Web Development',      title: 'JavaScript Quiz',           deadline: offsetDate(1),  priority: 'high',   status: 'pending',    description: '' }
  ];

  for (const t of demoTasks) {
    const result = await db.run(
      `INSERT OR IGNORE INTO tasks
         (id, user_id, course_id, course_name, title, description, priority, status, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.user_id, t.course_id, t.course_name, t.title, t.description, t.priority, t.status, t.deadline]
    );
    const label = result.changes > 0 ? 'created' : 'skipped (exists)';
    console.log(`  Task ${label}: ${t.title}`);
  }

  console.log('\nSeed complete. You can now start the server with: node server.js');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
