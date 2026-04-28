# StudyBalance

Smart Academic Workload Planning System — frontend web app with a Node.js + Express + SQLite backend.

---

## Project Structure

```
studybalance/
├── backend/
│   ├── server.js        Express server entry point
│   ├── db.js            SQLite database module (promisified helpers)
│   ├── schema.sql       Database table definitions
│   ├── seed.js          Demo data seeder
│   ├── package.json     Backend dependencies
│   └── .gitignore       Excludes node_modules and .db files
├── css/
│   └── style.css        Shared stylesheet for all pages
├── html/
│   ├── index.html       Landing page
│   ├── login.html       Student login
│   ├── register.html    Student registration
│   ├── dashboard.html   Student dashboard
│   ├── courses.html     Course management
│   ├── task-management.html  Task management
│   ├── heatmap.html     Workload heatmap
│   ├── scenario.html    What-if scenario simulator
│   ├── analytics.html   Analytics and charts
│   ├── profile.html     Student profile
│   ├── admin-login.html Admin login
│   ├── admin-dashboard.html  Admin overview
│   ├── manage-users.html     Admin: manage students
│   └── manage-task-records.html  Admin: view all tasks
└── js/
    ├── main.js          Shared utilities, seed, auth guards
    ├── auth.js          Login / register / admin login
    ├── dashboard.js     Dashboard page logic
    ├── courses.js       Courses CRUD
    ├── tasks.js         Tasks CRUD
    ├── heatmap.js       Heatmap calendar
    ├── scenario.js      What-if simulator
    ├── analytics.js     Analytics charts
    ├── profile.js       Profile edit
    └── admin.js         Admin pages
```

---

## Step 1 — Run the Backend

### Prerequisites

- Node.js 18 or newer — https://nodejs.org
- npm (comes with Node.js)

### Install dependencies

```bash
cd backend
npm install
```

### Seed the database with demo data

```bash
node seed.js
```

This creates `backend/studybalance.db` and inserts demo users, courses, and tasks.
Safe to re-run — existing rows are never overwritten.

### Start the server

```bash
node server.js
```

The API will be available at: **http://localhost:3000**

Health check: http://localhost:3000/api/health

---

## Open the Frontend

Open any HTML file directly in your browser:

```
html/index.html       ← start here
```

No local web server is required for the frontend at this stage.

---

## Demo Login Credentials

### Student accounts

| Name | Email | Password |
|---|---|---|
| Alex Johnson | alex@email.com | pass123 |
| John Doe | john@email.com | pass123 |

### Admin account

| Email | Password |
|---|---|
| admin@studybalance.com | admin123 |

---

## API Endpoints (Step 1 — health check only)

| Method | URL | Description |
|---|---|---|
| GET | /api/health | Server health check |

More routes will be added in Steps 2–7.

---

## Migration Steps

| Step | What gets built |
|---|---|
| ✅ Step 1 | Backend folder, database, schema, seed |
| Step 2 | Auth API — POST /api/register, POST /api/login |
| Step 3 | Connect login/register pages to API |
| Step 4 | Courses API + connect courses.js |
| Step 5 | Tasks API + connect tasks.js |
| Step 6 | Connect dashboard, analytics, heatmap, scenario |
| Step 7 | Admin API + connect admin.js |

---

## Database Schema

### users
| Column | Type | Notes |
|---|---|---|
| id | TEXT | UUID primary key |
| full_name | TEXT | |
| email | TEXT | Unique, case-insensitive |
| password_hash | TEXT | bcrypt hash |
| role | TEXT | 'student' or 'admin' |
| banned | INTEGER | 0 = active, 1 = banned |
| created_at | TEXT | ISO timestamp |

### courses
| Column | Type | Notes |
|---|---|---|
| id | TEXT | UUID primary key |
| user_id | TEXT | FK → users.id |
| name | TEXT | |
| code | TEXT | |
| instructor | TEXT | |
| credits | INTEGER | 1–12 |
| progress | INTEGER | 0–100 |
| created_at | TEXT | |

### tasks
| Column | Type | Notes |
|---|---|---|
| id | TEXT | UUID primary key |
| user_id | TEXT | FK → users.id |
| course_id | TEXT | FK → courses.id (nullable) |
| course_name | TEXT | Denormalised for display |
| title | TEXT | |
| description | TEXT | |
| priority | TEXT | 'high', 'medium', 'low' |
| status | TEXT | 'pending', 'inprogress', 'completed' |
| deadline | TEXT | YYYY-MM-DD |
| created_at | TEXT | |
