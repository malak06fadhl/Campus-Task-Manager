# Task Decisions: StudyBalance

## 1. Task Breakdown Strategy

- Tasks are broken down by **feature area**, not by file type.
- Each task group covers HTML + CSS + JS together for one feature, so each task produces a working, testable piece of the app.
- Tasks are ordered by dependency: shared foundation first, then auth, then student features, then admin features.
- Each task is small enough to implement in one focused session.

---

## 2. Task Grouping

| Group | Area                        | Rationale |
|-------|-----------------------------|-----------|
| 1     | Project setup & CSS system  | Must exist before any page can be built |
| 2     | Shared JS (`main.js`)       | Auth guards, seed data, and helpers used by all pages |
| 3     | Auth pages                  | Login and register must work before any guarded page |
| 4     | Dashboard                   | First page students see after login |
| 5     | Courses                     | Tasks depend on courses existing |
| 6     | Task Management             | Core feature, depends on courses |
| 7     | Heatmap                     | Reads from tasks |
| 8     | Scenario Simulator          | Reads from tasks |
| 9     | Analytics                   | Reads from tasks and courses |
| 10    | Profile                     | Reads from current user |
| 11    | Admin pages                 | Reads from all data |
| 12    | Landing page & polish       | Final pass: index.html, empty states, responsive QA |

---

## 3. Task Granularity Decisions

- Each task has a clear **single deliverable** (e.g. "render course cards from localStorage").
- Tasks that touch both HTML structure and JS logic are kept together — splitting them would leave broken intermediate states.
- CSS component tasks are grouped with the first page that uses them, not as standalone tasks.
- Responsive CSS is handled as part of each feature task, not deferred to the end.

---

## 4. Dependencies

```
Task 1 (CSS) ──────────────────────────────────────────┐
Task 2 (main.js) ──────────────────────────────────────┤
                                                        ▼
Task 3 (Auth) → Task 4 (Dashboard) → Task 5 (Courses) → Task 6 (Tasks)
                                                        ↓
                                          Task 7 (Heatmap)
                                          Task 8 (Scenario)
                                          Task 9 (Analytics)
                                          Task 10 (Profile)
                                          Task 11 (Admin)
                                                        ↓
                                          Task 12 (Polish)
```

---

## 5. Implementation Approach Per Task

| Task | Approach |
|------|----------|
| CSS system | Write all tokens, reset, layout shell, and shared components in one pass |
| main.js | Write all helpers, seed data, guards, and auto-init in one file |
| Auth | HTML forms + auth.js validation + localStorage read/write |
| Dashboard | Read localStorage, compute stats, render DOM dynamically |
| Courses | Full CRUD with modal, localStorage persistence, cascade delete |
| Tasks | Full CRUD with modal, filter bar, localStorage persistence |
| Heatmap | Dynamic grid generation from task deadlines, month navigation |
| Scenario | Form + week comparison logic + result card rendering |
| Analytics | Stat computation + CSS bar chart rendering |
| Profile | Form pre-fill from localStorage + save + logout |
| Admin | Page detection + table rendering + ban/unban actions |
| Polish | index.html, empty states, responsive fixes, nav consistency |

---

## 6. Testing Approach Per Task

- Each task is manually verified in the browser before moving to the next.
- Auth: test login with valid, invalid, and banned credentials.
- CRUD pages: test add, edit, delete, and empty state.
- Heatmap: verify cell colors match task counts.
- Scenario: test safe and warning outcomes.
- Analytics: verify percentages and bar widths are correct.
- Admin: test ban/unban, verify tables show all users/tasks.
- Responsive: test each completed page at 1280px, 900px, and 375px.

---

## 7. Out of Scope for Tasks

- Automated tests
- Backend integration
- Real authentication (JWT, sessions)
- Chart.js or any external library
- Deployment or build steps

---

## ✅ Review Checklist

Please confirm before `tasks.md` is generated:

- [ ] Is the task grouping order correct?
- [ ] Should any tasks be split further or merged?
- [ ] Is the dependency order acceptable (courses before tasks, tasks before heatmap)?
- [ ] Should admin tasks come before or after student feature tasks?
- [ ] Any tasks to add (e.g. a dedicated responsive QA task)?
