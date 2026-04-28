# Design Decisions: StudyBalance

## 1. Overall Architecture

- **Single-page-per-feature** approach: each feature is a separate HTML file.
- No client-side router. Navigation is plain `<a href>` links between HTML files.
- Each page loads `css/style.css` and `js/main.js`, then its own page-specific JS file.
- `main.js` runs on every page: seeds demo data, checks auth guard, sets sidebar active link, renders user chip.

---

## 2. File & Folder Structure

```
StudyBalance/
├── css/
│   └── style.css
├── js/
│   ├── main.js          # shared: seed, auth guard, sidebar, user chip
│   ├── auth.js          # login.html, register.html, admin-login.html
│   ├── dashboard.js     # dashboard.html
│   ├── courses.js       # courses.html
│   ├── tasks.js         # task-management.html
│   ├── heatmap.js       # heatmap.html
│   ├── scenario.js      # scenario.html
│   ├── analytics.js     # analytics.html
│   ├── profile.js       # profile.html
│   └── admin.js         # admin-dashboard, manage-users, manage-task-records
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

### Color Palette
| Token            | Value     | Usage                        |
|------------------|-----------|------------------------------|
| `--blue`         | `#2f6fe4` | Primary, active nav, buttons |
| `--blue-soft`    | `#eaf1ff` | Active nav bg, badge bg      |
| `--green`        | `#34a853` | Completed, safe, progress    |
| `--yellow`       | `#f9ab00` | Medium priority, pending     |
| `--red`          | `#ea4335` | High priority, urgent, error |
| `--purple`       | `#7c3aed` | Analytics accent             |
| `--bg`           | `#f4f6fb` | Page background              |
| `--card`         | `#ffffff` | Card / sidebar background    |
| `--text`         | `#172033` | Primary text                 |
| `--muted`        | `#6c7a92` | Secondary text, labels       |
| `--line`         | `#e9edf5` | Borders, dividers            |
| `--shadow`       | `0 4px 20px rgba(27,39,94,0.07)` | Card shadow |
| `--radius`       | `16px`    | Card border radius           |

### Typography
- Font: system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`)
- Base size: `15px`
- Headings: `font-weight: 700–800`
- Muted text: `color: var(--muted)`

### Layout
- Page shell: `display: flex`, sidebar fixed left, main content fills remaining width
- Sidebar width: `260px` on desktop
- Main content: `flex: 1`, `min-width: 0`, `padding: 28px`
- Top bar: white card, flex row, search left, user chip right
- Content sections: stacked vertically with `24px` gap

### Component Inventory
| Component       | Description |
|-----------------|-------------|
| `.sidebar`      | Fixed left nav, logo, nav links |
| `.topbar`       | Search + user chip row |
| `.card`         | White rounded card with shadow |
| `.summary-card` | Stat card with icon, label, value |
| `.badge`        | Pill badge — priority and status variants |
| `.btn`          | Primary, secondary, danger, ghost variants |
| `.modal`        | Fixed overlay + centered content card |
| `.form-field`   | Label + input/select/textarea group |
| `.data-table`   | Responsive table with header and rows |
| `.progress-bar` | Horizontal fill bar with percentage |
| `.heatmap-grid` | CSS grid of day cells |
| `.bar-chart`    | CSS-only horizontal bar chart |
| `.empty-state`  | Centered illustration + message |
| `.alert`        | Inline success / warning / error message |

---

## 4. Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `> 1100px` | Full layout: sidebar + main side by side |
| `≤ 1100px` | Summary grid goes 2-column |
| `≤ 900px`  | Sidebar collapses to horizontal scrollable top nav strip |
| `≤ 640px`  | Single column, reduced padding, modal becomes bottom sheet |

---

## 5. Sidebar Design

- Logo row: emoji mark + "StudyBalance" text in blue
- Nav links: emoji icon + label, `border-radius: 12px` on hover/active
- Active link: `background: var(--blue-soft)`, `color: var(--blue)`
- Student sidebar links: Dashboard, Courses, Tasks, Heatmap, Scenario, Analytics, Profile
- Admin sidebar links: Admin Dashboard, Manage Users, Manage Tasks
- On mobile (≤ 900px): sidebar becomes a horizontal flex row at the top, scrollable, no wrapping

---

## 6. Page-by-Page Layout Design

### `dashboard.html`
```
[Topbar: search | user chip]
[Welcome hero card: greeting + subtitle]
[Summary grid: 4 cards — Total, Completed, Pending, Urgent]
[Widget row: Priority Tasks | Mini Heatmap | Course Progress]
[Scenario shortcut card at bottom]
```

### `courses.html`
```
[Page header: title + "Add Course" button]
[Course cards grid: auto-fit, min 260px]
  Each card: name, code, credits, progress bar, Edit + Delete buttons
[Add/Edit modal]
```

### `task-management.html`
```
[Page header: title + "Add Task" button]
[Filter bar: status tabs + priority dropdown]
[Task list: stacked cards]
  Each card: title, course, deadline, priority badge, status badge, Edit + Delete
[Add/Edit modal]
```

### `heatmap.html`
```
[Page header]
[Month navigation: prev / current month label / next]
[Heatmap grid: 7 columns, day cells colored by intensity]
[Legend row]
[Weekly summary table below]
```

### `scenario.html`
```
[Page header]
[Form card: task selector, current deadline (readonly), proposed deadline, Analyze button]
[Result card: hidden until submit — shows week counts + recommendation]
```

### `analytics.html`
```
[Page header]
[Completion rate card: large percentage + subtitle]
[Bar chart: Tasks by Status]
[Bar chart: Tasks by Priority]
[Bar chart: Tasks per Course]
```

### `profile.html`
```
[Page header]
[Two-column grid: avatar card left | edit form right]
[Logout button in header area]
```

### `admin-dashboard.html`
```
[Admin topbar: admin name chip]
[Summary grid: 4 cards]
[Recent activity placeholder]
```

### `manage-users.html`
```
[Page header]
[Data table: Name, Email, Role, Status, Action (Ban/Unban)]
```

### `manage-task-records.html`
```
[Page header]
[Data table: Student, Task, Course, Deadline, Priority, Status]
```

---

## 7. Modal Design

- Triggered by Add/Edit buttons
- Fixed overlay: `rgba(18,25,45,0.45)` backdrop
- Content card: `width: min(580px, 100%)`, centered on desktop
- On mobile (≤ 640px): slides up from bottom, full width, rounded top corners
- Close: × button top-right + click outside overlay
- Form inside modal uses `.form-field` components

---

## 8. Badge Design

| Badge type       | Background  | Text color   |
|------------------|-------------|--------------|
| Priority: High   | `#fde8e6`   | `--red`      |
| Priority: Medium | `#fff3cd`   | `#b45309`    |
| Priority: Low    | `#dcfce7`   | `--green`    |
| Status: Pending  | `#f1f3f5`   | `--muted`    |
| Status: In Progress | `#eaf1ff` | `--blue`    |
| Status: Completed | `#dcfce7`  | `--green`    |

---

## 9. Heatmap Design

- CSS Grid: `repeat(7, 1fr)` columns
- Day cells: `aspect-ratio: 1`, `border-radius: 10px`
- Colors:
  - Empty: `#edf2f8`
  - Light (1): `#c8e6c9`
  - Moderate (2): `#fff176`
  - Busy (3–4): `#ffb74d`
  - Very Busy (5+): `#ef5350`
- Day number shown inside each cell
- Tooltip on hover: date + task count

---

## 10. CSS Bar Chart Design

- Container: `width: 100%`, `display: grid`, `gap: 12px`
- Each row: label left, bar fill right, percentage text at end
- Bar fill: `height: 12px`, `border-radius: 999px`, animated width via CSS transition
- Colors match badge colors per category

---

## 11. JavaScript Module Design

### `main.js` responsibilities
- `seedData()` — seeds demo users, courses, tasks if `sb_users` is absent
- `getData(key)` / `setData(key, val)` — localStorage wrappers
- `getCurrentUser()` — returns parsed `sb_currentUser`
- `guardStudent()` — redirects to login if no current user or role ≠ student
- `guardAdmin()` — redirects to admin-login if no current user or role ≠ admin
- `setSidebarActive()` — marks current page link as active
- `renderUserChip()` — injects user name into topbar chip

### Page JS responsibilities
- Each page JS file calls the appropriate guard on load
- Reads from localStorage, renders DOM, attaches event listeners
- Writes back to localStorage on form submit
- No shared state between pages — all state is in localStorage

---

## 12. Auth Flow

```
index.html
  └─→ login.html ──(success)──→ dashboard.html
  └─→ register.html ──(success)──→ login.html

admin-login.html ──(success)──→ admin-dashboard.html

Any student page (on load):
  guardStudent() → if no session → login.html

Any admin page (on load):
  guardAdmin() → if no session → admin-login.html
```

---

## ✅ Review Checklist

Please confirm or adjust before `design.md` is generated:

- [ ] Is the color palette correct? Any colors to change?
- [ ] Is the sidebar nav link list complete for both student and admin?
- [ ] Is the page layout structure for each page acceptable?
- [ ] Is the modal behavior (bottom sheet on mobile) acceptable?
- [ ] Is the heatmap color scheme acceptable?
- [ ] Are the CSS-only bar charts acceptable for analytics?
- [ ] Is the auth flow (guard on every page) acceptable?
- [ ] Any page layout or component to add or remove?


## Final Confirmation

- The color palette is correct.
- The sidebar navigation links are complete for both Student and Admin.
- The page layout structure is acceptable.
- The modal behavior is acceptable, including bottom sheet behavior on mobile.
- The heatmap color scheme is acceptable.
- CSS-only bar charts are acceptable for analytics.
- The auth flow with guards on every protected page is acceptable.
- No extra pages or components are needed.

Confirmed. Please generate design.md.