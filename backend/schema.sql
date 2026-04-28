-- StudyBalance Database Schema
-- SQLite — applied via db.js on startup

CREATE TABLE IF NOT EXISTS users (
  id            TEXT    PRIMARY KEY,
  full_name     TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'student',
  banned        INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS courses (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  code        TEXT    NOT NULL DEFAULT '',
  instructor  TEXT    NOT NULL DEFAULT '',
  credits     INTEGER NOT NULL DEFAULT 3,
  progress    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id   TEXT    REFERENCES courses(id) ON DELETE SET NULL,
  course_name TEXT    NOT NULL DEFAULT '',
  title       TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  priority    TEXT    NOT NULL DEFAULT 'medium',
  status      TEXT    NOT NULL DEFAULT 'pending',
  deadline    TEXT    NOT NULL DEFAULT '',
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id   ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_course_id ON tasks(course_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline  ON tasks(deadline)
