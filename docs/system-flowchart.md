# StudyBalance — System Flowchart

## Flowchart (Mermaid)

```mermaid
flowchart TD
    A([Start]) --> B[Open index.html\nLanding Page]

    B --> C{Choose action}
    C --> D[Student Login\nlogin.html]
    C --> E[Student Register\nregister.html]
    C --> F[Admin Login\nadmin-login.html]

    %% ── Registration ──
    E --> E1[Fill name, email,\npassword, confirm]
    E1 --> E2{Client-side\nvalidation OK?}
    E2 -- No --> E1
    E2 -- Yes --> E3[POST /api/register]
    E3 --> E4{Email already\nexists?}
    E4 -- Yes --> E5[Show error:\nEmail already exists]
    E5 --> E1
    E4 -- No --> E6[Hash password\nInsert user row\nIssue JWT]
    E6 --> G[Save sb_token\n+ sb_currentUser\nto localStorage]
    G --> H[dashboard.html]

    %% ── Student Login ──
    D --> D1[Enter email\n+ password]
    D1 --> D2[POST /api/login]
    D2 --> D3{Credentials\nvalid?}
    D3 -- No --> D4[Show inline\nerror message]
    D4 --> D1
    D3 -- Banned --> D5[Show suspended\nerror message]
    D3 -- Yes --> D6{role?}
    D6 -- student --> G
    D6 -- admin --> AF[Save sb_token\n+ sb_currentUser]
    AF --> AG[admin-dashboard.html]

    %% ── Admin Login ──
    F --> F1[Enter admin\nemail + password]
    F1 --> F2[POST /api/login]
    F2 --> F3{Valid admin\ncredentials?}
    F3 -- No --> F4[Show error]
    F4 --> F1
    F3 -- Yes --> AF

    %% ── Student Pages ──
    H --> I{Student\nnavigates to}

    I --> J[Courses\ncourses.html]
    J --> J1[GET /api/courses]
    J1 --> J2[View course cards\nwith progress bars]
    J2 --> J3{Action}
    J3 -- Add --> J4[POST /api/courses]
    J3 -- Edit --> J5[PUT /api/courses/:id]
    J3 -- Delete --> J6[DELETE /api/courses/:id\nSET NULL on tasks]
    J4 & J5 & J6 --> J2

    I --> K[Tasks\ntask-management.html]
    K --> K1[GET /api/tasks\n+ GET /api/courses]
    K1 --> K2[View task cards\nwith filters]
    K2 --> K3{Action}
    K3 -- Add --> K4[POST /api/tasks]
    K3 -- Edit --> K5[PUT /api/tasks/:id]
    K3 -- Delete --> K6[DELETE /api/tasks/:id]
    K4 & K5 & K6 --> K2

    I --> L[Analytics\nanalytics.html]
    L --> L1[GET /api/tasks\n+ GET /api/courses]
    L1 --> L2[Compute stats\nclient-side]
    L2 --> L3[Render summary cards\ninsight cards\nCSS bar charts\ncourse progress]

    I --> M[Heatmap\nheatmap.html]
    M --> M1[GET /api/tasks]
    M1 --> M2[Build monthly\ncalendar grid]
    M2 --> M3{Click a day}
    M3 --> M4[Show tasks\ndue that day]
    M2 --> M5[Navigate\nprev / next month]
    M5 --> M2

    I --> N[Scenario\nscenario.html]
    N --> N1[GET /api/tasks]
    N1 --> N2[Select task\n+ proposed deadline]
    N2 --> N3[Compare week\ntask counts\nclient-side]
    N3 --> N4{Workload\nincreases?}
    N4 -- Yes --> N5[Show warning\nresult card]
    N4 -- No --> N6[Show safe\nresult card]

    I --> O[Profile\nprofile.html]
    O --> O1[Load from\nsb_currentUser]
    O1 --> O2[Edit name\nemail password]
    O2 --> O3[Update localStorage\nsb_currentUser]

    I --> P[Logout]
    P --> P1[Clear sb_token\n+ sb_currentUser]
    P1 --> D

    %% ── Admin Pages ──
    AG --> Q{Admin\nnavigates to}

    Q --> R[Manage Users\nmanage-users.html]
    R --> R1[GET /api/admin/users]
    R1 --> R2[View students table\nwith course + task counts]
    R2 --> R3{Ban / Unban}
    R3 --> R4[PATCH /api/admin/users/:id/ban]
    R4 --> R2

    Q --> S[Manage Task Records\nmanage-task-records.html]
    S --> S1[GET /api/admin/tasks]
    S1 --> S2[View all tasks\nacross all students]
    S2 --> S3[Filter by status\npriority search]
    S3 --> S2

    Q --> T[Admin Logout]
    T --> T1[Clear sb_token\n+ sb_currentUser]
    T1 --> F
```

---

## Flowchart Explanation

The flowchart above describes the complete navigation and data flow of the StudyBalance system from start to finish.

**Entry point.** All users begin at the landing page (`index.html`), which provides links to the student login, student registration, and admin login pages.

**Student registration.** The registration form performs client-side validation before sending a `POST /api/register` request. The backend checks for duplicate emails, hashes the password, inserts the user, and returns a JWT. The student is automatically logged in and redirected to the dashboard.

**Student login.** The login form sends credentials to `POST /api/login`. The backend verifies the password hash, checks the ban status, and returns a JWT. The frontend stores the token and user object in `localStorage` and redirects based on role.

**Student pages.** Once authenticated, the student can navigate between six pages — Dashboard, Courses, Tasks, Analytics, Heatmap, Scenario, and Profile. Each page that displays data fetches it from the backend API using the stored JWT. CRUD operations (add, edit, delete) on courses and tasks send the appropriate HTTP method to the corresponding API endpoint. Analytics, Heatmap, and Scenario pages are read-only and compute their output client-side from the fetched data.

**Admin login.** The admin uses the same `/api/login` endpoint. The frontend checks the returned role and redirects to the admin dashboard only if `role === 'admin'`.

**Admin pages.** The admin can view all registered students with their course and task counts, ban or unban individual students, and view all task records across the platform. All admin API routes are protected by both JWT verification and role enforcement.

**Logout.** Both student and admin logout clears the JWT and user object from `localStorage` and redirects to the appropriate login page.
