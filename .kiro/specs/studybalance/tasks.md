# Tasks: StudyBalance

## Task 1: CSS Design System & Shared Layout Styles
**File:** `css/style.css`

- [ ] Define all CSS custom properties (colors, spacing, radius, shadow, sidebar width)
- [ ] Write CSS reset and base body/html styles
- [ ] Build page shell layout (`.page-shell`, `.sidebar`, `.page-body`, `.main-content`)
- [ ] Build sidebar component (logo row, nav links, active/hover states)
- [ ] Build topbar component (search input, user chip)
- [ ] Build summary card component (`.summary-card`, `.summary-icon`, color variants)
- [ ] Build badge component (priority: high/medium/low, status: pending/inprogress/completed)
- [ ] Build button component (primary, success, danger, ghost, sm, full variants)
- [ ] Build form field component (label, input, select, textarea, focus state)
- [ ] Build modal component (overlay, box, header, close button)
- [ ] Build data table component (wrapper, th, td, hover row)
- [ ] Build progress bar component (track + fill)
- [ ] Build CSS bar chart component (bar-row, bar-track, bar-fill, bar-label, bar-value)
- [ ] Build empty state component
- [ ] Build alert component (success, warning, danger variants)
- [ ] Build card and widget base styles
- [ ] Write all responsive breakpoints (900px, 640px, 400px)

---

## Task 2: Shared JavaScript Utilities (`main.js`)
**File:** `js/main.js`

- [ ] Implement `SB.getData(key)` and `SB.setData(key, val)` localStorage wrappers
- [ ] Implement `SB.getCurrentUser()` helper
- [ ] Implement `SB.guardStudent()` — redirect to login if no valid student session
- [ ] Implement `SB.guardAdmin()` — redirect to admin-login if no valid admin session
- [ ] Implement `SB.genId()` — unique ID generator
- [ ] Implement `SB.formatDate(isoStr)` — returns "May 10, 2026"
- [ ] Implement `SB.daysUntil(isoStr)` — returns integer days from today
- [ ] Implement `SB.seedData()` — seeds demo users, courses, tasks if `sb_users` absent
- [ ] Implement `SB.setSidebarActive()` — marks current page nav link as `.active`
- [ ] Implement `SB.renderUserChip()` — injects user name/role into `.user-chip`
- [ ] Auto-call `seedData()`, `setSidebarActive()`, `renderUserChip()` on `DOMContentLoaded`

---

## Task 3: Authentication Pages
**Files:** `html/login.html`, `html/register.html`, `html/admin-login.html`, `js/auth.js`

- [ ] Build `login.html` — centered auth card, email + password fields, submit button, link to register
- [ ] Build `register.html` — centered auth card, name + email + password + confirm fields, link to login
- [ ] Build `admin-login.html` — same auth card style, admin branding
- [ ] Implement login logic — find user in `sb_users`, check banned, set `sb_currentUser`, redirect to dashboard
- [ ] Implement register logic — validate fields, check email uniqueness, push to `sb_users`, redirect to login
- [ ] Implement admin login logic — compare hardcoded credentials, set admin `sb_currentUser`, redirect to admin-dashboard
- [ ] Show inline error messages for invalid credentials, banned account, mismatched passwords
- [ ] Redirect already-logged-in users away from auth pages

---

## Task 4: Dashboard Page
**Files:** `html/dashboard.html`, `js/dashboard.js`

- [ ] Build `dashboard.html` HTML structure — page shell, sidebar, topbar, content sections
- [ ] Render 4 summary cards dynamically (total, completed, pending, urgent) from `sb_tasks`
- [ ] Render Priority Tasks card — top 5 tasks sorted by priority weight then nearest deadline
- [ ] Render mini heatmap card — current week 7 cells colored by task count per day
- [ ] Render Course Progress card — top 3 courses with progress bars from `sb_courses`
- [ ] Render Scenario shortcut card at the bottom with link to scenario.html
- [ ] Show welcome message with logged-in user's name
- [ ] Handle empty state when no tasks or courses exist yet

---

## Task 5: Courses Page
**Files:** `html/courses.html`, `js/courses.js`

- [ ] Build `courses.html` HTML structure — page header with Add Course button, courses grid, modal
- [ ] Render course cards from `sb_courses` filtered by current user
- [ ] Each card shows: name, code, credits, progress bar, Edit and Delete buttons
- [ ] Implement Add Course modal — form with name, code, credits, progress fields
- [ ] Implement Edit Course — pre-fill modal with existing values, update on save
- [ ] Implement Delete Course — remove course and all linked tasks from localStorage
- [ ] Persist all changes to `sb_courses` in localStorage
- [ ] Show empty state when no courses exist

---

## Task 6: Task Management Page
**Files:** `html/task-management.html`, `js/tasks.js`

- [ ] Build `task-management.html` HTML structure — page header, filter bar, task list, modal
- [ ] Render task cards from `sb_tasks` filtered by current user
- [ ] Each card shows: title, course name, deadline, priority badge, status badge, Edit and Delete buttons
- [ ] Implement filter bar — status tabs (All/Pending/In Progress/Completed) and priority dropdown
- [ ] Apply active filters when rendering task list
- [ ] Implement Add Task modal — title, course dropdown (from `sb_courses`), deadline, priority, status
- [ ] Implement Edit Task — pre-fill modal, update on save
- [ ] Implement Delete Task — remove from localStorage, re-render
- [ ] Persist all changes to `sb_tasks` in localStorage
- [ ] Show empty state when no tasks match current filter

---

## Task 7: Heatmap Page
**Files:** `html/heatmap.html`, `js/heatmap.js`

- [ ] Build `heatmap.html` HTML structure — page header, month nav, heatmap grid card, legend, weekly summary
- [ ] Generate full monthly calendar grid (correct day-of-week offset for first day)
- [ ] Count task deadlines per day from `sb_tasks` for current user
- [ ] Color each day cell by intensity: empty / light / moderate / busy / very-busy
- [ ] Show day number inside each cell
- [ ] Add tooltip on hover showing date and task count
- [ ] Implement previous/next month navigation
- [ ] Render legend row below grid
- [ ] Render weekly summary table showing Mon–Sun task counts for current week

---

## Task 8: Scenario Simulator Page
**Files:** `html/scenario.html`, `js/scenario.js`

- [ ] Build `scenario.html` HTML structure — page header, form card, result card (hidden)
- [ ] Populate task dropdown from `sb_tasks` for current user
- [ ] Auto-fill current deadline input when a task is selected
- [ ] On Analyze: count tasks in the ISO week of the current deadline
- [ ] On Analyze: count tasks in the ISO week of the proposed deadline
- [ ] Render result card with both counts and a recommendation message
- [ ] Show warning alert if proposed week has more tasks than current week
- [ ] Show safe alert if proposed week has equal or fewer tasks
- [ ] Hide result card on page load, show after first analysis

---

## Task 9: Analytics Page
**Files:** `html/analytics.html`, `js/analytics.js`

- [ ] Build `analytics.html` HTML structure — page header, stat cards, bar chart cards
- [ ] Compute and render completion rate as a large percentage card
- [ ] Render Tasks by Status bar chart (Pending / In Progress / Completed)
- [ ] Render Tasks by Priority bar chart (High / Medium / Low)
- [ ] Render Tasks per Course bar chart (one bar per course)
- [ ] Animate bar fill widths on page load using CSS transitions
- [ ] Handle empty state when no tasks exist

---

## Task 10: Profile Page
**Files:** `html/profile.html`, `js/profile.js`

- [ ] Build `profile.html` HTML structure — page header with logout button, two-column grid
- [ ] Render avatar card with initial letter, name, role, and member-since placeholder
- [ ] Pre-fill edit form with current user's name and email from `sb_currentUser`
- [ ] On save: validate fields, update matching user in `sb_users`, update `sb_currentUser`
- [ ] Handle optional password change — only update if new password field is not empty
- [ ] Show success alert after saving
- [ ] Implement logout — clear `sb_currentUser`, redirect to `login.html`

---

## Task 11: Admin Pages
**Files:** `html/admin-dashboard.html`, `html/manage-users.html`, `html/manage-task-records.html`, `js/admin.js`

- [ ] Build `admin-dashboard.html` — admin page shell with admin sidebar, 4 summary cards
- [ ] Compute admin summary stats: total users, total courses, total tasks, overload alerts
- [ ] Build `manage-users.html` — data table of all student users
- [ ] Render users table: Name, Email, Role, Status (Active/Banned), Action button
- [ ] Implement Ban — set `banned: true` on user in `sb_users`, re-render table
- [ ] Implement Unban — set `banned: false` on user in `sb_users`, re-render table
- [ ] Build `manage-task-records.html` — data table of all tasks across all users
- [ ] Render tasks table: Student name, Task title, Course, Deadline, Priority badge, Status badge
- [ ] Sort tasks table by deadline ascending
- [ ] Use `data-page` attribute on `<body>` to detect which admin page is active

---

## Task 12: Landing Page & Final Polish
**Files:** `html/index.html`, all pages

- [ ] Build `index.html` — hero landing page with app name, subtitle, Login and Register buttons, feature highlights
- [ ] Add empty state components to all CRUD pages (courses, tasks)
- [ ] Verify sidebar active link is correct on every page
- [ ] Verify auth guards work on all student and admin pages
- [ ] Test responsive layout at 1280px, 900px, and 375px for all pages
- [ ] Fix any horizontal scroll issues on small screens
- [ ] Ensure modal closes on outside click and × button on all pages
- [ ] Verify seed data loads correctly on first visit in a fresh browser
- [ ] Check all internal links navigate to the correct pages
