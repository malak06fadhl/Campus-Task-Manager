# StudyBalance — System Explanation

## 1. Overview

StudyBalance is a full-stack academic workload planning web application designed to help university students manage their courses, tasks, and deadlines. The system consists of a static HTML/CSS/JavaScript frontend, a Node.js + Express REST API backend, and a SQLite relational database. Authentication is handled using JSON Web Tokens (JWT), and all persistent data is stored server-side in the database.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | SQLite (via the `sqlite3` npm package) |
| Authentication | JSON Web Tokens (JWT) via `jsonwebtoken` |
| Password Security | bcrypt hashing via `bcrypt` |
| Cross-Origin | CORS middleware (`cors`) |

---

## 3. System Architecture

The system follows a three-tier architecture:

1. **Presentation Layer** — HTML pages served directly from the filesystem. JavaScript files make `fetch()` API calls to the backend. The session token (`sb_token`) and current user object (`sb_currentUser`) are stored in the browser's `localStorage`.

2. **Application Layer** — An Express.js server running on `http://localhost:3000`. It exposes a RESTful JSON API, validates requests, enforces authentication and authorisation, and interacts with the database.

3. **Data Layer** — A single SQLite database file (`backend/studybalance.db`) containing three tables: `users`, `courses`, and `tasks`.

---

## 4. Authentication Flow

### 4.1 Registration

1. The user fills in the registration form (`html/register.html`) with their full name, email, and password.
2. The frontend validates the input client-side (required fields, email format, password length ≥ 6, password confirmation match).
3. A `POST /api/register` request is sent to the backend with `{ full_name, email, password }`.
4. The backend validates the fields, checks for duplicate emails, hashes the password using bcrypt (cost factor 10), and inserts a new row into the `users` table with `role = 'student'` and `banned = 0`.
5. A JWT is signed with the user's `id` and `role`, set to expire in 7 days.
6. The response returns the JWT and the user object (without `password_hash`).
7. The frontend stores the token as `sb_token` and the user object as `sb_currentUser` in `localStorage`, then redirects to `dashboard.html`.

### 4.2 Login

1. The user submits the login form (`html/login.html`) with their email and password.
2. A `POST /api/login` request is sent to the backend.
3. The backend looks up the user by email (case-insensitive), compares the submitted password against the stored bcrypt hash using `bcrypt.compare()`, and checks whether the account is banned.
4. On success, a JWT is issued and returned alongside the safe user object.
5. The frontend stores the token and user in `localStorage` and redirects based on role: students go to `dashboard.html`, admins go to `admin-dashboard.html`.

### 4.3 JWT Verification

Every protected API route passes the request through the `requireAuth` middleware (`backend/middleware/auth.js`). This middleware:

- Reads the `Authorization: Bearer <token>` header.
- Verifies the token using `jwt.verify()` with the shared secret.
- Attaches `req.user = { userId, role }` to the request for downstream handlers.
- Returns HTTP 401 if the token is missing or invalid.

Admin routes additionally pass through `requireAdmin`, which returns HTTP 403 if `req.user.role !== 'admin'`.

### 4.4 Logout

Logout clears both `sb_token` and `sb_currentUser` from `localStorage` and redirects to the appropriate login page.

---

## 5. Student Flow

### 5.1 Landing Page

The entry point is `html/index.html`, which presents the application name, a brief description, and two call-to-action buttons: **Student Login** and **Admin Login**. A feature highlights section describes the four core capabilities: course management, task management, heatmap, and what-if scenario simulation.

### 5.2 Dashboard (`html/dashboard.html`)

After login, the student lands on the dashboard. On page load, `js/dashboard.js` calls `GET /api/tasks` and `GET /api/courses` in parallel. The page renders:

- **Summary cards** — total tasks, completed tasks, pending tasks, and urgent tasks (due within 48 hours and not completed).
- **Priority Tasks widget** — the top 5 non-completed tasks sorted by priority weight (high → medium → low) then nearest deadline.
- **Mini Heatmap widget** — a 7-cell grid showing the current week (Monday to Sunday) with each cell coloured by the number of tasks due that day.
- **Course Progress widget** — the first three courses with animated progress bars.
- **Scenario shortcut** — a card linking to the What-If Scenario page.

### 5.3 Courses (`html/courses.html`)

The courses page loads all courses for the logged-in student via `GET /api/courses`. Each course card displays the course name, code, instructor, credit hours, a task count badge, and a progress bar. Students can:

- **Add** a course via a modal form (name, code, instructor, credits, progress slider). Sends `POST /api/courses`.
- **Edit** a course by clicking the Edit button, which pre-fills the modal. Sends `PUT /api/courses/:id`.
- **Delete** a course via a confirmation modal. Sends `DELETE /api/courses/:id`. The database foreign key constraint (`ON DELETE SET NULL`) nullifies the `course_id` on any linked tasks.

All course operations are scoped to the authenticated user — the backend verifies ownership before allowing edits or deletions.

### 5.4 Task Management (`html/task-management.html`)

The task management page loads tasks and courses in parallel via `GET /api/tasks` and `GET /api/courses`. Tasks are displayed as cards with a colour-coded left border (red = high, yellow = medium, green = low priority). Each card shows the title, course name, deadline with days-remaining label, priority badge, and status badge.

Students can:

- **Add** a task via a modal form (title, course dropdown populated from the API, priority, status, deadline, optional description). Sends `POST /api/tasks`.
- **Edit** a task. Sends `PUT /api/tasks/:id`.
- **Delete** a task via a confirmation modal. Sends `DELETE /api/tasks/:id`.
- **Filter** tasks by status (All / Pending / In Progress / Completed) and priority (All / High / Medium / Low).
- **Sort** tasks by deadline ascending/descending, priority, or title.
- **Search** tasks by title, course name, or description.

The backend validates that the selected `course_id` belongs to the requesting user before creating or updating a task.

### 5.5 Analytics (`html/analytics.html`)

The analytics page fetches tasks and courses from the API and computes all statistics client-side in `js/analytics.js`. It displays:

- **Summary cards** — total tasks, completion rate percentage, high-priority task count, overdue task count.
- **Insight cards** — contextual messages such as most loaded course, best progress course, high-priority risk warning, overdue warning, and completion rate feedback.
- **Tasks by Status** — a CSS-only horizontal bar chart showing pending, in-progress, and completed counts.
- **Tasks by Priority** — a CSS-only bar chart for high, medium, and low priority counts.
- **Tasks by Course** — a bar chart with one bar per course, sorted by task count descending.
- **Course Progress** — a list of all courses sorted by progress percentage, each with a progress bar and status label.

No chart library is used; all charts are rendered with CSS `width` transitions.

### 5.6 Heatmap (`html/heatmap.html`)

The heatmap page fetches all tasks via `GET /api/tasks` and builds a monthly calendar grid in `js/heatmap.js`. Each day cell is coloured by workload intensity:

| Tasks due | Intensity | Colour |
|---|---|---|
| 0 | None | Light grey |
| 1 | Light | Light green |
| 2 | Moderate | Yellow |
| 3 | Busy | Orange |
| 4+ | Very Busy | Red |

Features include:
- **Month navigation** — previous/next month buttons and a "Today" button.
- **Day detail panel** — clicking a day cell shows all tasks due on that date with their priority and status badges.
- **Monthly summary cards** — total tasks this month, busiest day, very busy days (4+ tasks), and completed this month.
- **Weekly workload summary** — a bar chart showing task counts for each day of the current week.
- **Search** — filters which tasks appear on the heatmap by title or course name.

### 5.7 What-If Scenario Simulator (`html/scenario.html`)

The scenario page fetches tasks via `GET /api/tasks` and allows students to simulate the impact of moving a task's deadline. The workflow is:

1. Select a task from the dropdown (grouped by course, with days-remaining suffix).
2. The current deadline is auto-filled in a read-only field.
3. The student enters a proposed new deadline (defaulting to current + 7 days).
4. Clicking **Analyze Impact** compares the number of tasks in the current deadline's ISO week against the proposed week.
5. A result card is shown with the week task counts, a safe/warning outcome, and a recommendation message.

The simulation logic runs entirely client-side using the cached task data — no additional API call is made on analysis.

### 5.8 Profile (`html/profile.html`)

The profile page pre-fills the edit form from `sb_currentUser` in `localStorage`. Students can update their full name, email, and optionally their password. On save, the frontend calls `PUT /api/tasks` — **Note:** profile updates are currently handled client-side only; the profile page updates `sb_currentUser` in `localStorage` without a dedicated profile API endpoint. The logout button clears `sb_token` and `sb_currentUser` and redirects to `login.html`.

---

## 6. Admin Flow

### 6.1 Admin Login (`html/admin-login.html`)

The admin login page uses the same `POST /api/login` endpoint as student login. The backend returns the user's role in the JWT payload. If `role === 'admin'`, the frontend redirects to `admin-dashboard.html`. If a student account attempts to log in via the admin login page, the frontend checks the returned role and shows an error.

The admin account is seeded into the database by `backend/seed.js` with the credentials `admin@studybalance.com` / `admin123`.

### 6.2 Admin Dashboard (`html/admin-dashboard.html`)

On load, `js/admin.js` fetches `GET /api/admin/users` and `GET /api/admin/tasks` in parallel. The dashboard displays:

- **Summary cards** — total students, active students, total courses (summed across all students), total tasks.
- **Recent Users table** — the five most recently registered students with their name, email, and active/banned status.
- **Tasks by Status bar chart** — pending, in-progress, and completed counts across all students.

### 6.3 Manage Users (`html/manage-users.html`)

The manage users page loads all student accounts via `GET /api/admin/users`. The API returns each user's `id`, `full_name`, `email`, `role`, `banned`, `created_at`, `total_courses`, and `total_tasks` (computed via SQL `COUNT(DISTINCT ...)` joins). The table supports live search by name or email (client-side filtering of cached data).

Each row has a **Ban** or **Unban** button. Clicking it sends `PATCH /api/admin/users/:id/ban` to the backend, which toggles the `banned` field. The backend refuses to ban admin accounts (HTTP 403). A banned student cannot log in — the login endpoint returns HTTP 403 with a suspension message.

### 6.4 Manage Task Records (`html/manage-task-records.html`)

The manage task records page loads all tasks across all students via `GET /api/admin/tasks`. The API joins the `users` and `courses` tables to return `student_name`, `student_email`, `course_name`, and `course_code` alongside each task. The table is read-only (admin cannot edit or delete tasks). It supports:

- **Status filter tabs** — All / Pending / In Progress / Completed.
- **Priority dropdown filter** — All / High / Medium / Low.
- **Search** — by task title, course name, student name, or student email.
- **Overdue indicator** — tasks past their deadline with status not Completed are highlighted with a red row background and an overdue label.

All filtering is performed client-side on the cached task data.

---

## 7. Frontend–Backend–Database Interaction

The following describes the complete data flow for a typical operation (adding a task):

1. The student clicks **+ Add Task** on `task-management.html`.
2. `js/tasks.js` opens the modal and populates the course dropdown from `cachedCourses` (already fetched on page load).
3. The student fills in the form and submits.
4. `js/tasks.js` sends `POST /api/tasks` with the JWT in the `Authorization` header and the task data in the JSON body.
5. The Express server receives the request, passes it through `requireAuth` middleware (verifies JWT, attaches `req.user`), then routes it to `backend/routes/tasks.js`.
6. The route handler validates all fields, verifies the `course_id` belongs to `req.user.userId`, generates a UUID, and executes an `INSERT` SQL statement via `db.run()`.
7. The newly created task row is fetched with a `LEFT JOIN` on `courses` to include `course_name` and `course_code`.
8. The response `{ task: { ... } }` is returned with HTTP 201.
9. `js/tasks.js` receives the response, closes the modal, and calls `loadAll()` to re-fetch and re-render the task list.

---

## 8. Data Storage

### 8.1 What is stored in the database

All persistent application data is stored in `backend/studybalance.db`:

- **users** — account credentials (bcrypt-hashed), role, and ban status.
- **courses** — each student's enrolled courses with name, code, instructor, credits, and progress percentage.
- **tasks** — each student's academic tasks with title, description, priority, status, deadline, and a reference to the owning course.

### 8.2 What is stored in localStorage

The browser's `localStorage` holds only session data:

- `sb_token` — the JWT issued on login or registration. Sent as `Authorization: Bearer <token>` with every API request.
- `sb_currentUser` — a JSON object with the logged-in user's `id`, `name`, `email`, `role`, `banned`, and `joinedAt`. Used by the frontend to display the user's name in the topbar and to guard page access.

No course or task data is stored in `localStorage` in the current implementation.

---

## 9. Security Considerations

- **Password hashing** — all passwords are hashed with bcrypt (cost factor 10) before storage. Plain-text passwords are never written to the database.
- **JWT expiry** — tokens expire after 7 days. Expired tokens are rejected by `requireAuth`.
- **Ownership enforcement** — every course and task mutation verifies that the resource's `user_id` matches `req.user.userId` before proceeding.
- **Role enforcement** — admin routes are protected by both `requireAuth` and `requireAdmin`. A student JWT cannot access `/api/admin/*` endpoints.
- **Input sanitisation** — all user-generated content rendered into the DOM passes through an `escHtml()` function that escapes `&`, `<`, `>`, and `"` characters to prevent XSS.
- **SQL injection prevention** — all database queries use parameterised statements (`?` placeholders) via the `sqlite3` driver.
