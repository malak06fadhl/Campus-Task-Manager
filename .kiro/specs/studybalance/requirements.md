# Requirements: StudyBalance

## Overview

StudyBalance is a frontend-only student productivity web app built with HTML, CSS, and JavaScript. It helps university students manage their courses, tasks, and academic workload. All data is persisted in the browser's localStorage. The app includes a student-facing interface and a separate admin panel.

---

## User Roles

### Student
- Can register and log in with email and password.
- Can manage their own courses and tasks.
- Can view their workload heatmap, run scenario simulations, and view analytics.
- Cannot access admin pages.

### Admin
- Logs in via a separate admin login page using hardcoded credentials.
- Can view all registered users and all task records across the platform.
- Cannot create, edit, or delete student data directly.
- Admin credentials: `admin@studybalance.com` / `admin123`.

---

## Functional Requirements

### FR-01: Authentication

| ID       | Requirement |
|----------|-------------|
| FR-01-1  | A student can register with full name, email, and password. |
| FR-01-2  | Registration must validate that password and confirm password match. |
| FR-01-3  | Registered user data is stored in localStorage under `sb_users`. |
| FR-01-4  | A student can log in with a registered email and password. |
| FR-01-5  | On successful login, the current user is stored in `sb_currentUser` and the student is redirected to `dashboard.html`. |
| FR-01-6  | If login credentials do not match any user, an error message is shown. |
| FR-01-7  | A banned student cannot log in and sees an appropriate message. |
| FR-01-8  | The student can log out from the profile page, which clears `sb_currentUser` and redirects to `login.html`. |
| FR-01-9  | Admin can log in via `admin-login.html` using hardcoded credentials. |
| FR-01-10 | On successful admin login, the admin is redirected to `admin-dashboard.html`. |
| FR-01-11 | All student pages check for a valid `sb_currentUser` on load and redirect to `login.html` if not found. |
| FR-01-12 | All admin pages check for admin role in `sb_currentUser` and redirect to `admin-login.html` if not found. |

---

### FR-02: Dashboard

| ID       | Requirement |
|----------|-------------|
| FR-02-1  | The dashboard displays a top bar with a search input and a user profile chip showing the logged-in student's name. |
| FR-02-2  | The dashboard displays four summary cards: Total Tasks, Completed, Pending, and Urgent. |
| FR-02-3  | Summary card values are computed dynamically from the student's tasks in localStorage. |
| FR-02-4  | Urgent tasks are defined as tasks with a deadline within 48 hours and a status that is not Completed. |
| FR-02-5  | The dashboard displays a Priority Tasks card listing up to 5 tasks sorted by priority (High first) and nearest deadline. |
| FR-02-6  | The dashboard displays a mini Academic Heatmap card showing the current week's workload intensity. |
| FR-02-7  | The dashboard displays a Courses card showing up to 3 courses with their progress bars. |
| FR-02-8  | The dashboard displays a What-If Scenario section at the bottom with a shortcut to the scenario page. |
| FR-02-9  | The sidebar navigation highlights the active page link. |

---

### FR-03: Courses

| ID       | Requirement |
|----------|-------------|
| FR-03-1  | The courses page displays all courses belonging to the logged-in student. |
| FR-03-2  | Each course card shows: course name, course code, credit hours, and a progress bar. |
| FR-03-3  | A student can add a new course via a modal form with fields: name, code, credit hours, and progress (0–100). |
| FR-03-4  | A student can edit an existing course via the same modal form pre-filled with current values. |
| FR-03-5  | A student can delete a course. Deleting a course also deletes all tasks linked to that course. |
| FR-03-6  | Course data is stored in localStorage under `sb_courses`. |
| FR-03-7  | If no courses exist, a friendly empty state message is shown. |

---

### FR-04: Task Management

| ID       | Requirement |
|----------|-------------|
| FR-04-1  | The task management page displays all tasks belonging to the logged-in student. |
| FR-04-2  | Each task card shows: title, course name, deadline, priority badge, and status badge. |
| FR-04-3  | Priority badge values: High (red), Medium (yellow), Low (green). |
| FR-04-4  | Status badge values: Pending (gray), In Progress (blue), Completed (green). |
| FR-04-5  | A student can add a new task via a modal form with fields: title, course (dropdown from saved courses), deadline, priority, and status. |
| FR-04-6  | A student can edit an existing task via the same modal form pre-filled with current values. |
| FR-04-7  | A student can delete a task. |
| FR-04-8  | Tasks can be filtered by status (All, Pending, In Progress, Completed). |
| FR-04-9  | Tasks can be filtered by priority (All, High, Medium, Low). |
| FR-04-10 | Task data is stored in localStorage under `sb_tasks`. |
| FR-04-11 | If no tasks exist, a friendly empty state message is shown. |

---

### FR-05: Heatmap

| ID       | Requirement |
|----------|-------------|
| FR-05-1  | The heatmap page displays a full monthly calendar grid for the current month. |
| FR-05-2  | Each day cell is colored based on the number of task deadlines falling on that day. |
| FR-05-3  | Intensity levels: empty (0 tasks), Light (1 task), Moderate (2 tasks), Busy (3–4 tasks), Very Busy (5+ tasks). |
| FR-05-4  | A legend is shown below the heatmap explaining each intensity level. |
| FR-05-5  | Hovering over a day cell shows a tooltip with the date and number of tasks due. |
| FR-05-6  | The heatmap reads task deadlines from `sb_tasks` for the logged-in student. |
| FR-05-7  | A weekly workload summary section below the heatmap lists the number of tasks due each day of the current week. |

---

### FR-06: Scenario Simulator

| ID       | Requirement |
|----------|-------------|
| FR-06-1  | The scenario page provides a form with: task selector (dropdown), current deadline (auto-filled), and proposed new deadline (date input). |
| FR-06-2  | On clicking Analyze, the simulator counts tasks due in the week of the current deadline and the week of the proposed deadline. |
| FR-06-3  | If the proposed week has more tasks than the current week, a warning result card is shown. |
| FR-06-4  | If the proposed week has equal or fewer tasks, a safe result card is shown. |
| FR-06-5  | The result card shows: current week task count, proposed week task count, and a recommendation message. |
| FR-06-6  | The result card is hidden until the form is submitted. |

---

### FR-07: Analytics

| ID       | Requirement |
|----------|-------------|
| FR-07-1  | The analytics page displays a task completion rate as a percentage. |
| FR-07-2  | The analytics page displays a tasks-by-status breakdown (Pending, In Progress, Completed) as a CSS bar chart. |
| FR-07-3  | The analytics page displays a tasks-by-priority breakdown (High, Medium, Low) as a CSS bar chart. |
| FR-07-4  | The analytics page displays a tasks-per-course breakdown as a CSS bar chart. |
| FR-07-5  | All charts are built with CSS only — no external chart libraries. |
| FR-07-6  | All analytics data is computed from `sb_tasks` and `sb_courses` for the logged-in student. |

---

### FR-08: Profile

| ID       | Requirement |
|----------|-------------|
| FR-08-1  | The profile page displays the student's current name and email. |
| FR-08-2  | The student can edit their name, email, and password via a form. |
| FR-08-3  | Password field is optional — if left blank, the existing password is kept. |
| FR-08-4  | On saving, the updated data is written back to `sb_users` and `sb_currentUser` in localStorage. |
| FR-08-5  | A success message is shown after saving. |
| FR-08-6  | A logout button clears `sb_currentUser` and redirects to `login.html`. |

---

### FR-09: Admin Dashboard

| ID       | Requirement |
|----------|-------------|
| FR-09-1  | The admin dashboard displays four summary cards: Total Users, Total Courses, Total Tasks, Overload Alerts. |
| FR-09-2  | Overload Alerts = number of students who have 5 or more tasks due in any single day. |
| FR-09-3  | All values are computed from the full `sb_users`, `sb_courses`, and `sb_tasks` localStorage data. |

---

### FR-10: Manage Users

| ID       | Requirement |
|----------|-------------|
| FR-10-1  | The manage users page displays a table of all registered students with columns: Name, Email, Role, Status, Action. |
| FR-10-2  | The admin can ban an active student. Banned students cannot log in. |
| FR-10-3  | The admin can unban a banned student. |
| FR-10-4  | The ban/unban action updates the user's `banned` field in `sb_users`. |

---

### FR-11: Manage Task Records

| ID       | Requirement |
|----------|-------------|
| FR-11-1  | The manage task records page displays a table of all tasks across all students with columns: Student, Task Title, Course, Deadline, Priority, Status. |
| FR-11-2  | The table is read-only — admin cannot edit or delete tasks. |
| FR-11-3  | The table is sorted by deadline ascending by default. |

---

## Non-Functional Requirements

| ID      | Requirement |
|---------|-------------|
| NFR-01  | The app must be fully functional by opening HTML files directly in a browser (no local server required). |
| NFR-02  | All pages must be responsive and usable at 1280px (laptop), 900px (tablet), and 375px (mobile). |
| NFR-03  | No horizontal scrolling on any page at any breakpoint. |
| NFR-04  | All pages must share a single `css/style.css` stylesheet. |
| NFR-05  | The visual design must be consistent across all pages (same sidebar, topbar, card style, color palette). |
| NFR-06  | Demo seed data must be loaded into localStorage on first visit so the app is not empty. |
| NFR-07  | No external libraries, frameworks, or CDN dependencies are allowed. |
| NFR-08  | User passwords are stored in localStorage as plain text (acceptable for demo/assignment scope). |

---

## Data Model

```js
// sb_currentUser
{
  id: "u1",
  name: "Alex Johnson",
  email: "alex@email.com",
  role: "student",       // "student" | "admin"
  banned: false
}

// sb_users — array
[
  { id, name, email, password, role, banned }
]

// sb_courses — array
[
  { id, userId, name, code, credits, progress }
  // progress: 0–100 (integer)
]

// sb_tasks — array
[
  { id, userId, courseId, courseName, title, deadline, priority, status }
  // priority: "high" | "medium" | "low"
  // status:   "pending" | "inprogress" | "completed"
  // deadline: "YYYY-MM-DD"
]
```

---

## Seed Data

On first load (when `sb_users` does not exist in localStorage), the following demo data is seeded:

- **2 student accounts**: Alex Johnson and John Doe
- **3 courses per student**: e.g. Software Engineering, Database Systems, Discrete Mathematics
- **6–8 tasks per student** spread across different priorities, statuses, and deadlines within the current month
- **1 admin account**: stored separately, matched against hardcoded credentials at login
