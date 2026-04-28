# Decisions: StudyBalance Requirements

## 1. Scope Decisions

- The app is a **frontend-only** student productivity web app.
- No backend, no server, no database — all data lives in **localStorage**.
- The project is intended for **university assignment presentation**, so it must look polished and professional.
- Scope is limited to: course management, task management, workload visualization, what-if scenario simulation, and a basic admin panel.

---

## 2. User Roles

| Role    | Description                                                  |
|---------|--------------------------------------------------------------|
| Student | Registers, logs in, manages their own courses and tasks      |
| Admin   | Logs in via a separate admin login, views all users and tasks |

- Students cannot access admin pages.
- Admin cannot manage courses or tasks directly — read-only oversight only.

---

## 3. Main Features

### Student Features
- **Authentication**: Register and login with email + password (stored in localStorage)
- **Dashboard**: Summary cards (total tasks, completed, pending, urgent), priority task list, mini heatmap, course progress preview, what-if scenario section
- **Courses**: Add, edit, delete courses with name, code, credit hours, and progress percentage
- **Task Management**: Add, edit, delete tasks with title, course, deadline, priority (High/Medium/Low), and status (Pending/In Progress/Completed)
- **Heatmap**: Monthly calendar grid showing workload intensity per day based on task deadlines
- **Scenario Simulator**: Input a current and proposed deadline, get a result card showing whether the change increases workload
- **Analytics**: Visual stats — tasks by status, tasks by course, completion rate (CSS-only bar charts, no external library)
- **Profile**: View and edit name, email, password; logout button

### Admin Features
- **Admin Login**: Separate login page with hardcoded admin credentials
- **Admin Dashboard**: Summary cards — total users, total courses, total tasks, overload alerts
- **Manage Users**: Table of all registered students with ban/unban action
- **Manage Task Records**: Table of all tasks across all students

---

## 4. Business Rules

- A task must belong to a course.
- Priority levels: High, Medium, Low.
- Status levels: Pending, In Progress, Completed.
- Urgent tasks = tasks with deadline within 48 hours and status not Completed.
- Heatmap intensity is based on number of task deadlines per day:
  - 0 tasks → empty
  - 1 task → Light
  - 2 tasks → Moderate
  - 3–4 tasks → Busy
  - 5+ tasks → Very Busy
- Scenario simulator compares task count in the current deadline's week vs. the proposed deadline's week.
- If the proposed week has more tasks, show a warning. Otherwise show a safe result.
- Admin credentials are hardcoded: `admin@studybalance.com` / `admin123`.
- Demo seed data is loaded into localStorage on first visit (if no data exists).

---

## 5. Technical Choices

| Decision              | Choice                                      |
|-----------------------|---------------------------------------------|
| Language              | HTML, CSS, JavaScript (vanilla)             |
| Storage               | localStorage                                |
| Styling               | One shared `css/style.css`                  |
| JS structure          | One JS file per page + shared `main.js`     |
| Charts / graphs       | CSS-only (no Chart.js, no D3)               |
| Icons                 | Emoji icons (no icon library needed)        |
| Fonts                 | System font stack (no Google Fonts needed)  |
| Routing               | Direct HTML file links (no SPA router)      |
| Frameworks            | None                                        |

---

## 6. Pages to Build

| File                        | Purpose                        |
|-----------------------------|--------------------------------|
| `html/index.html`           | Landing page with login/register links |
| `html/login.html`           | Student login                  |
| `html/register.html`        | Student registration           |
| `html/dashboard.html`       | Main student dashboard         |
| `html/courses.html`         | Course management              |
| `html/task-management.html` | Task management                |
| `html/heatmap.html`         | Workload heatmap               |
| `html/scenario.html`        | What-if scenario simulator     |
| `html/analytics.html`       | Analytics and stats            |
| `html/profile.html`         | Student profile                |
| `html/admin-login.html`     | Admin login                    |
| `html/admin-dashboard.html` | Admin overview                 |
| `html/manage-users.html`    | Admin: manage users            |
| `html/manage-task-records.html` | Admin: manage task records |

---

## 7. localStorage Data Model

```js
sb_currentUser  // { id, name, email, role, banned }
sb_users        // [ { id, name, email, password, role, banned } ]
sb_courses      // [ { id, userId, name, code, credits, progress } ]
sb_tasks        // [ { id, userId, courseId, title, deadline, priority, status } ]
```

---

## 8. Implementation Priorities

1. Shared CSS design system (colors, sidebar, cards, badges, modals, responsive)
2. Shared JS utilities (localStorage helpers, seed data, sidebar active state)
3. Auth pages (login, register, admin login)
4. Dashboard (reads from localStorage, computes stats)
5. Courses (full CRUD)
6. Task Management (full CRUD)
7. Heatmap (generated from task deadlines)
8. Scenario simulator
9. Analytics
10. Profile
11. Admin pages (dashboard, users, tasks)

---

## 9. Testing Approach

- Manual browser testing across Chrome/Firefox.
- Responsive testing at 1280px (laptop), 900px (tablet), 375px (mobile).
- Verify localStorage read/write by checking DevTools → Application → localStorage.
- No automated tests (out of scope for this project type).

---

## ✅ Review Checklist

Please confirm or adjust the following before requirements.md is generated:

- [ ] Are the user roles (Student + Admin) correct?
- [ ] Is the feature list complete? Anything to add or remove?
- [ ] Are the business rules (urgency, heatmap intensity, scenario logic) correct?
- [ ] Is the page list correct?
- [ ] Are the admin credentials acceptable (hardcoded)?
- [ ] Should analytics use CSS-only charts or is Chart.js acceptable?


## Final Confirmation

- User roles are correct: Student and Admin.
- Feature list is complete.
- Business rules are correct.
- Page list is correct.
- Hardcoded admin credentials are acceptable for this assignment demo.
- Analytics should use CSS-only charts, no Chart.js.

Confirmed. Please generate requirements.md.