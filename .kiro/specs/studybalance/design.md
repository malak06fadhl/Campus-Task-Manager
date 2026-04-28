# Design: StudyBalance

## 1. Architecture Overview

StudyBalance is a multi-page frontend application. Each feature maps to a dedicated HTML file. There is no client-side router — navigation uses plain `<a href>` links. Every page loads the shared stylesheet and `main.js`, then its own page-specific JavaScript file.

```
Browser
  └── HTML page
        ├── css/style.css          (shared, always)
        ├── js/main.js             (shared, always)
        └── js/{page}.js           (page-specific)
```

All persistent state lives in `localStorage`. There is no network layer, no build step, and no external dependencies.

---

## 2. File Structure

```
StudyBalance/
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── courses.js
│   ├── tasks.js
│   ├── heatmap.js
│   ├── scenario.js
│   ├── analytics.js
│   ├── profile.js
│   └── admin.js
└── html/
    ├── index.html
    ├── login.html
    ├── register.html
    ├── dashboard.html
    ├── courses.html
    ├── task-management.html
    ├── heatmap.html
    ├── scenario.html
    ├── analytics.html
    ├── profile.html
    ├── admin-login.html
    ├── admin-dashboard.html
    ├── manage-users.html
    └── manage-task-records.html
```

---

## 3. CSS Design System

### 3.1 CSS Custom Properties

All design tokens are defined as CSS variables on `:root` in `style.css`:

```css
:root {
  --blue:        #2f6fe4;
  --blue-soft:   #eaf1ff;
  --green:       #34a853;
  --yellow:      #f9ab00;
  --red:         #ea4335;
  --purple:      #7c3aed;
  --bg:          #f4f6fb;
  --card:        #ffffff;
  --text:        #172033;
  --muted:       #6c7a92;
  --line:        #e9edf5;
  --shadow:      0 4px 20px rgba(27, 39, 94, 0.07);
  --radius:      16px;
  --radius-sm:   10px;
  --sidebar-w:   260px;
}
```

### 3.2 Typography

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  font-size: 15px;
  color: var(--text);
  background: var(--bg);
}
```

- Page titles: `font-size: clamp(1.5rem, 2.5vw, 2rem)`, `font-weight: 800`
- Section headings: `font-size: 1.1rem`, `font-weight: 700`
- Muted labels: `color: var(--muted)`, `font-size: 0.875rem`

### 3.3 Spacing Scale

| Token  | Value  |
|--------|--------|
| `--s1` | `8px`  |
| `--s2` | `16px` |
| `--s3` | `24px` |
| `--s4` | `32px` |

---

## 4. Page Shell Layout

Every student page uses this shell structure:

```html
<div class="page-shell">
  <aside class="sidebar"> ... </aside>
  <div class="page-body">
    <header class="topbar"> ... </header>
    <main class="main-content"> ... </main>
  </div>
</div>
```

```css
.page-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--card);
  border-right: 1px solid var(--line);
  padding: 24px 16px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.page-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
```

Admin pages use the same shell with a different sidebar link set.

---

## 5. Component Specifications

### 5.1 Sidebar

```
┌─────────────────────┐
│  ⚖️  StudyBalance   │  ← logo row
├─────────────────────┤
│  🏠  Dashboard      │  ← active: blue-soft bg, blue text
│  📚  Courses        │
│  ✅  Tasks          │
│  🗓️  Heatmap        │
│  📈  Scenario       │
│  📊  Analytics      │
│  👤  Profile        │
└─────────────────────┘
```

- Logo: `font-size: 1.4rem`, `font-weight: 800`, `color: var(--blue)`
- Nav links: `padding: 12px 14px`, `border-radius: var(--radius-sm)`, `font-weight: 600`
- Active / hover: `background: var(--blue-soft)`, `color: var(--blue)`
- `setSidebarActive()` in `main.js` matches `window.location.pathname` to set `.active`

Admin sidebar links: Admin Dashboard, Manage Users, Manage Tasks.

### 5.2 Topbar

```
┌──────────────────────────────────────────────────────┐
│  🔍 Search tasks, courses...        Alex Johnson  ▾  │
└──────────────────────────────────────────────────────┘
```

```css
.topbar {
  background: var(--card);
  border-bottom: 1px solid var(--line);
  padding: 14px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
```

- Search input: `width: min(400px, 100%)`, `border-radius: 999px`, `border: 1px solid var(--line)`
- User chip: name in bold, role label in muted, optional dropdown caret

### 5.3 Summary Card

```
┌──────────────────────────┐
│  🔵  Total Tasks         │
│       24                 │
│       Across all courses │
└──────────────────────────┘
```

```css
.summary-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 22px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}
```

Icon background colors: blue-soft (total), green-soft, yellow-soft, red-soft.

Summary grid: `display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px`

### 5.4 Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

/* Priority */
.badge-high     { background: #fde8e6; color: var(--red); }
.badge-medium   { background: #fff3cd; color: #b45309; }
.badge-low      { background: #dcfce7; color: var(--green); }

/* Status */
.badge-pending     { background: #f1f3f5; color: var(--muted); }
.badge-inprogress  { background: var(--blue-soft); color: var(--blue); }
.badge-completed   { background: #dcfce7; color: var(--green); }
```

### 5.5 Buttons

```css
.btn {
  border: none;
  border-radius: var(--radius-sm);
  padding: 10px 18px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.1s ease;
}
.btn:hover  { filter: brightness(0.95); }
.btn:active { transform: scale(0.98); }

.btn-primary  { background: var(--blue);    color: #fff; }
.btn-success  { background: var(--green);   color: #fff; }
.btn-danger   { background: #fde8e6;        color: var(--red); }
.btn-ghost    { background: transparent;    color: var(--muted); border: 1px solid var(--line); }
.btn-sm       { padding: 6px 12px; font-size: 0.8rem; }
.btn-full     { width: 100%; }
```

### 5.6 Form Fields

```css
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text);
}

.form-field input,
.form-field select,
.form-field textarea {
  padding: 11px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  background: #fff;
  color: var(--text);
  outline: none;
  transition: border-color 0.15s;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(47, 111, 228, 0.12);
}
```

Form grid inside modals: `display: grid; grid-template-columns: 1fr 1fr; gap: 16px`
Full-width fields: `grid-column: 1 / -1`

### 5.7 Modal

```
┌─────────────────────────────────────┐
│  Add Course                      ×  │
├─────────────────────────────────────┤
│  [form fields]                      │
│                                     │
│  [Cancel]              [Save]       │
└─────────────────────────────────────┘
```

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(18, 25, 45, 0.45);
  display: none;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}
.modal-overlay.open { display: flex; }

.modal-box {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: 0 20px 60px rgba(18, 25, 45, 0.18);
  width: min(580px, 100%);
  padding: 28px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}
```

Close: click × button or click outside `.modal-box`.

### 5.8 Data Table

```css
.table-wrapper {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.data-table th {
  background: #f8f9fc;
  padding: 13px 16px;
  text-align: left;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--line);
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
  font-size: 0.9rem;
}

.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #fafbff; }
```

### 5.9 Progress Bar

```css
.progress-bar-track {
  width: 100%;
  height: 8px;
  background: var(--line);
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--blue);
  transition: width 0.4s ease;
}
```

### 5.10 Empty State

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--muted);
  text-align: center;
  gap: 12px;
}

.empty-state .empty-icon { font-size: 3rem; }
.empty-state p { font-size: 0.95rem; max-width: 280px; }
```

### 5.11 Alert / Result Card

```css
.alert {
  padding: 16px 20px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-size: 0.9rem;
}
.alert-success { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
.alert-warning { background: #fffbeb; border-color: #fde68a; color: #92400e; }
.alert-danger  { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
```

### 5.12 CSS Bar Chart

```css
.bar-chart { display: grid; gap: 14px; }

.bar-row {
  display: grid;
  grid-template-columns: 130px 1fr 40px;
  align-items: center;
  gap: 12px;
}

.bar-label { font-size: 0.875rem; font-weight: 600; color: var(--text); }

.bar-track {
  height: 12px;
  background: var(--line);
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.5s ease;
}

.bar-value { font-size: 0.8rem; color: var(--muted); font-weight: 600; }
```

Bar fill colors: `--blue` (in progress), `--green` (completed), `--yellow` (pending), `--red` (high), `--purple` (analytics accent).

---

## 6. Page Layout Designs

### 6.1 `dashboard.html`

```
[Topbar]
[Hero card: "Good morning, {name} 👋" + subtitle]
[Summary grid: 4 summary-cards]
[3-column widget row]
  ├── Priority Tasks card (1.2fr)
  ├── Mini Heatmap card (1fr)
  └── Course Progress card (1fr)
[Scenario shortcut card]
```

Widget row: `display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 20px`
At ≤ 1100px: `grid-template-columns: 1fr 1fr`
At ≤ 900px: `grid-template-columns: 1fr`

### 6.2 `courses.html`

```
[Page header: "My Courses" + Add Course btn]
[Course cards grid: auto-fit minmax(260px, 1fr)]
  Each card:
    Course name (h3)
    Code · Credits row
    Progress bar + percentage
    [Edit btn] [Delete btn]
[Empty state if no courses]
[Add/Edit modal]
```

### 6.3 `task-management.html`

```
[Page header: "Task Management" + Add Task btn]
[Filter bar: status tabs | priority select]
[Task list: stacked cards]
  Each card:
    Left: title (bold) + course name (muted)
    Right: deadline · priority badge · status badge · Edit · Delete
[Empty state if no tasks]
[Add/Edit modal]
```

Filter tabs: All / Pending / In Progress / Completed
Priority select: All / High / Medium / Low

### 6.4 `heatmap.html`

```
[Page header: "Academic Heatmap"]
[Month nav card: ← May 2026 →]
[Heatmap grid card: 7 columns, day cells]
[Legend row]
[Weekly summary card: table of Mon–Sun with task counts]
```

### 6.5 `scenario.html`

```
[Page header: "What-If Scenario Simulator"]
[Form card]
  Task selector (dropdown)
  Current deadline (readonly input, auto-filled)
  Proposed new deadline (date input)
  [Analyze Impact] button
[Result card — hidden until submit]
  Current week: N tasks
  Proposed week: N tasks
  Recommendation message
  Warning or safe alert
```

### 6.6 `analytics.html`

```
[Page header: "Analytics"]
[Completion rate card: big % number + label]
[Tasks by Status — bar chart card]
[Tasks by Priority — bar chart card]
[Tasks per Course — bar chart card]
```

### 6.7 `profile.html`

```
[Page header: "My Profile" + Logout btn]
[2-column grid]
  Left: avatar card (initial letter, name, role, member since)
  Right: edit form card (name, email, new password, save btn)
[Success alert on save]
```

Profile grid: `grid-template-columns: 280px 1fr`
At ≤ 900px: `grid-template-columns: 1fr`

### 6.8 `admin-dashboard.html`

```
[Admin topbar: "Admin Panel" label + admin chip]
[Summary grid: Total Users, Total Courses, Total Tasks, Overload Alerts]
[Recent users table (last 5 registered)]
```

### 6.9 `manage-users.html`

```
[Page header: "Manage Users"]
[Table wrapper]
  Columns: Name | Email | Role | Status | Action
  Action: Ban btn (active users) / Unban btn (banned users)
```

### 6.10 `manage-task-records.html`

```
[Page header: "Manage Task Records"]
[Table wrapper]
  Columns: Student | Task Title | Course | Deadline | Priority | Status
  Read-only, sorted by deadline ascending
```

---

## 7. Responsive Design

### Breakpoints

```css
/* Tablet: sidebar collapses */
@media (max-width: 900px) {
  .page-shell    { flex-direction: column; }
  .sidebar       { width: 100%; height: auto; position: static;
                   border-right: none; border-bottom: 1px solid var(--line);
                   padding: 12px 16px; }
  .sidebar-nav   { display: flex; flex-direction: row; overflow-x: auto;
                   gap: 6px; scrollbar-width: none; }
  .sidebar-nav a { white-space: nowrap; padding: 8px 12px; font-size: 0.85rem; }
  .main-content  { padding: 20px; }
}

/* Mobile: single column */
@media (max-width: 640px) {
  .main-content        { padding: 14px; gap: 16px; }
  .summary-grid        { grid-template-columns: 1fr 1fr; }
  .modal-overlay       { align-items: flex-end; padding: 0; }
  .modal-box           { width: 100%; border-radius: var(--radius) var(--radius) 0 0;
                         max-height: 85vh; }
  .profile-grid        { grid-template-columns: 1fr; }
  .bar-row             { grid-template-columns: 100px 1fr 36px; }
}

/* Small mobile */
@media (max-width: 400px) {
  .summary-grid { grid-template-columns: 1fr; }
}
```

---

## 8. JavaScript Module Design

### 8.1 `main.js`

```js
// Exposed globals used by all page scripts
window.SB = {
  getData(key),           // JSON.parse(localStorage.getItem(key)) ?? []
  setData(key, val),      // localStorage.setItem(key, JSON.stringify(val))
  getCurrentUser(),       // SB.getData('sb_currentUser')
  guardStudent(),         // redirect to login if not student
  guardAdmin(),           // redirect to admin-login if not admin
  seedData(),             // seeds sb_users, sb_courses, sb_tasks if absent
  setSidebarActive(),     // matches href to current path, adds .active
  renderUserChip(),       // injects name into .user-chip element
  genId(),                // returns crypto.randomUUID() or Date.now() fallback
  formatDate(isoStr),     // returns "May 10, 2026"
  daysUntil(isoStr),      // returns integer days from today
}
```

`main.js` is loaded before page-specific scripts. It calls `seedData()`, `setSidebarActive()`, and `renderUserChip()` automatically on `DOMContentLoaded`.

### 8.2 `auth.js`

- Handles `#loginForm`, `#registerForm`, `#adminLoginForm`
- On login: finds user in `sb_users`, checks banned, sets `sb_currentUser`, redirects
- On register: validates fields, checks email uniqueness, pushes to `sb_users`, redirects to login
- On admin login: compares against hardcoded credentials, sets admin `sb_currentUser`

### 8.3 `dashboard.js`

- Calls `SB.guardStudent()`
- Reads `sb_tasks` filtered by `userId`, computes: total, completed, pending, urgent
- Renders 4 summary cards
- Renders top 5 priority tasks sorted by priority weight then deadline
- Renders mini heatmap (current week, 7 cells)
- Renders top 3 courses with progress bars

### 8.4 `courses.js`

- Calls `SB.guardStudent()`
- Reads/writes `sb_courses` filtered by `userId`
- `renderCourses()` — clears grid, maps courses to cards, appends
- `openModal(course?)` — populates form if editing, clears if adding
- `saveModal()` — validates, upserts course in localStorage, re-renders
- `deleteCourse(id)` — removes course + all tasks with matching `courseId`

### 8.5 `tasks.js`

- Calls `SB.guardStudent()`
- Reads/writes `sb_tasks` filtered by `userId`
- `renderTasks(filter)` — filters by status/priority, maps to cards
- `openModal(task?)` — populates course dropdown from `sb_courses`, pre-fills if editing
- `saveModal()` — validates, upserts task, re-renders
- `deleteTask(id)` — removes task, re-renders
- Filter state held in module-level variables `activeStatus`, `activePriority`

### 8.6 `heatmap.js`

- Calls `SB.guardStudent()`
- State: `currentYear`, `currentMonth` (default: today)
- `buildHeatmap()` — counts tasks per day, renders grid
- `getIntensity(count)` — returns CSS class: `hm-empty`, `hm-light`, `hm-moderate`, `hm-busy`, `hm-very-busy`
- Prev/next month buttons update state and call `buildHeatmap()`
- `renderWeeklySummary()` — renders Mon–Sun task count table for current week

### 8.7 `scenario.js`

- Calls `SB.guardStudent()`
- Populates task dropdown from `sb_tasks`
- On task select: auto-fills current deadline input
- `analyze()` — counts tasks in current deadline's ISO week vs. proposed week
- Renders result card with counts and recommendation
- Warning if proposed week count > current week count

### 8.8 `analytics.js`

- Calls `SB.guardStudent()`
- Reads `sb_tasks` and `sb_courses` for current user
- `renderCompletionRate()` — percentage of completed tasks
- `renderBarChart(containerId, data)` — generic bar chart renderer
- Calls renderer for: by-status, by-priority, by-course breakdowns

### 8.9 `profile.js`

- Calls `SB.guardStudent()`
- Populates form from `sb_currentUser`
- On save: validates, updates matching user in `sb_users`, updates `sb_currentUser`
- Shows `.alert-success` on save
- Logout: removes `sb_currentUser`, redirects to `login.html`

### 8.10 `admin.js`

- Calls `SB.guardAdmin()`
- Shared by `admin-dashboard.html`, `manage-users.html`, `manage-task-records.html`
- Detects current page by `document.body.dataset.page`
- `renderAdminDashboard()` — computes and renders 4 summary cards
- `renderUsersTable()` — renders all non-admin users, ban/unban buttons
- `renderTasksTable()` — renders all tasks joined with user and course names, sorted by deadline

---

## 9. localStorage Data Model

```js
// Key: 'sb_currentUser'  — Object
{
  id:     "u1",
  name:   "Alex Johnson",
  email:  "alex@email.com",
  role:   "student",          // "student" | "admin"
  banned: false
}

// Key: 'sb_users'  — Array
[{
  id:       "u1",
  name:     "Alex Johnson",
  email:    "alex@email.com",
  password: "pass123",
  role:     "student",
  banned:   false
}]

// Key: 'sb_courses'  — Array
[{
  id:       "c1",
  userId:   "u1",
  name:     "Software Engineering",
  code:     "SE201",
  credits:  4,
  progress: 67          // integer 0–100
}]

// Key: 'sb_tasks'  — Array
[{
  id:         "t1",
  userId:     "u1",
  courseId:   "c1",
  courseName: "Software Engineering",
  title:      "Project Proposal",
  deadline:   "2026-05-10",   // ISO date string
  priority:   "high",         // "high" | "medium" | "low"
  status:     "pending"       // "pending" | "inprogress" | "completed"
}]
```

---

## 10. Auth Flow

```
index.html
  ├── → login.html
  │       └── (success) → dashboard.html
  └── → register.html
          └── (success) → login.html

admin-login.html
  └── (success) → admin-dashboard.html

On every student page load:
  SB.guardStudent()
    ├── no sb_currentUser       → redirect login.html
    └── role !== "student"      → redirect login.html

On every admin page load:
  SB.guardAdmin()
    ├── no sb_currentUser       → redirect admin-login.html
    └── role !== "admin"        → redirect admin-login.html
```

---

## 11. Seed Data Specification

Seeded when `sb_users` is absent from localStorage:

**Users**
| id  | name         | email             | password | role    |
|-----|--------------|-------------------|----------|---------|
| u1  | Alex Johnson | alex@email.com    | pass123  | student |
| u2  | John Doe     | john@email.com    | pass123  | student |

**Courses** (for u1)
| id  | name                  | code     | credits | progress |
|-----|-----------------------|----------|---------|----------|
| c1  | Software Engineering  | SE201    | 4       | 67       |
| c2  | Database Systems      | CS301    | 3       | 50       |
| c3  | Discrete Mathematics  | MATH105  | 3       | 40       |

**Tasks** (for u1, deadlines relative to current month)
| id  | courseId | title                  | priority | status     |
|-----|----------|------------------------|----------|------------|
| t1  | c1       | Project Proposal       | high     | pending    |
| t2  | c2       | Database Design ERD    | high     | inprogress |
| t3  | c3       | Problem Set 3          | medium   | pending    |
| t4  | c1       | Sprint Review Slides   | medium   | completed  |
| t5  | c2       | SQL Query Assignment   | low      | completed  |
| t6  | c3       | Research Paper Draft   | medium   | pending    |
| t7  | c1       | Unit Testing Report    | high     | pending    |
| t8  | c2       | ER Diagram Revision    | low      | inprogress |

Deadlines are set dynamically at seed time: `t1` = today+1, `t2` = today+2, `t3` = today+5, `t4` = today-3, `t5` = today-5, `t6` = today+7, `t7` = today+1, `t8` = today+4.

Courses and tasks for u2 mirror u1 with different titles and deadlines.
