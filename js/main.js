/* ============================================================
   StudyBalance — Shared Utilities
   js/main.js
   Loaded on every page before page-specific scripts.
   ============================================================ */

window.SB = (function () {

  /* ── 1. localStorage Helpers ──────────────────────────── */

  function getData(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('SB.getData: failed to parse key:', key, e);
      return null;
    }
  }

  function setData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('SB.setData: failed to write key:', key, e);
    }
  }

  function removeData(key) {
    localStorage.removeItem(key);
  }

  /* ── 2. ID & Date Utilities ───────────────────────────── */

  function genId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // fallback for older browsers
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /**
   * Format an ISO date string to a readable label.
   * e.g. "2026-05-10" → "May 10, 2026"
   */
  function formatDate(isoStr) {
    if (!isoStr) return '—';
    const [year, month, day] = isoStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /**
   * Return number of days from today until the given ISO date.
   * Negative means the date is in the past.
   */
  function daysUntil(isoStr) {
    if (!isoStr) return null;
    const [year, month, day] = isoStr.split('-').map(Number);
    const target = new Date(year, month - 1, day);
    const today  = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
  }

  /**
   * Return today's date as an ISO string "YYYY-MM-DD".
   */
  function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  /**
   * Add `n` days to today and return as ISO string.
   */
  function offsetDate(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  /* ── 3. Current User & Token ─────────────────────────── */

  function getCurrentUser() {
    return getData('sb_currentUser');
  }

  function getToken() {
    return getData('sb_token');
  }

  /* ── 4. Auth Guards ───────────────────────────────────── */

  /**
   * Call at the top of every student page.
   * Redirects to login if no valid student session exists.
   */
  function guardStudent() {
    const user = getCurrentUser();
    if (!user || user.role !== 'student') {
      window.location.replace('../html/login.html');
      return false;
    }
    return true;
  }

  /**
   * Call at the top of every admin page.
   * Redirects to admin-login if no valid admin session exists.
   */
  function guardAdmin() {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      window.location.replace('../html/admin-login.html');
      return false;
    }
    return true;
  }

  /* ── 5. Logout ────────────────────────────────────────── */

  function logout() {
    removeData('sb_currentUser');
    removeData('sb_token');
    window.location.replace('../html/login.html');
  }

  /* ── 6. Sidebar Active Link ───────────────────────────── */

  /**
   * Marks the sidebar nav link whose href matches the current page
   * filename as `.active`. Works regardless of folder depth.
   */
  function setSidebarActive() {
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.sidebar-nav a');
    links.forEach(function (link) {
      const linkFile = link.getAttribute('href').split('/').pop();
      if (linkFile === currentFile) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /* ── 7. Topbar User Chip ──────────────────────────────── */

  /**
   * Injects the logged-in user's name and role initial into
   * any `.user-chip` element found on the page.
   */
  function renderUserChip() {
    const user = getCurrentUser();
    if (!user) return;

    const chips = document.querySelectorAll('.user-chip');
    chips.forEach(function (chip) {
      const avatarEl = chip.querySelector('.user-avatar');
      const nameEl   = chip.querySelector('.user-chip-name');
      const roleEl   = chip.querySelector('.user-chip-role');

      if (avatarEl) {
        avatarEl.textContent = user.name ? user.name.charAt(0).toUpperCase() : '?';
      }
      if (nameEl) {
        nameEl.textContent = user.name || user.full_name || 'User';
      }
      if (roleEl) {
        roleEl.textContent = user.role === 'admin' ? 'Administrator' : 'Student';
      }
    });
  }

  /* ── 8. Seed Demo Data ────────────────────────────────── */

  /*
   * seedData() is ADDITIVE — it never overwrites existing data.
   * It only inserts the two demo accounts (u1, u2) if they are not
   * already present in sb_users, and only inserts their demo courses
   * and tasks if those IDs don't already exist.
   * Real user accounts, courses, and tasks are never touched.
   */
  function seedData() {
    /* ── Ensure sb_users array exists ── */
    var users = getData('sb_users') || [];

    /* ── Insert demo users only if their IDs are absent ── */
    var demoUsers = [
      {
        id:       'u1',
        name:     'Alex Johnson',
        email:    'alex@email.com',
        password: 'pass123',
        role:     'student',
        banned:   false,
        joinedAt: offsetDate(-30)
      },
      {
        id:       'u2',
        name:     'John Doe',
        email:    'john@email.com',
        password: 'pass123',
        role:     'student',
        banned:   false,
        joinedAt: offsetDate(-20)
      }
    ];

    var existingIds    = users.map(function (u) { return u.id; });
    var existingEmails = users.map(function (u) { return u.email.toLowerCase(); });
    var usersChanged   = false;

    demoUsers.forEach(function (demo) {
      /* Skip if this demo user id OR email already exists */
      if (existingIds.indexOf(demo.id) === -1 &&
          existingEmails.indexOf(demo.email.toLowerCase()) === -1) {
        users.push(demo);
        usersChanged = true;
      }
    });

    if (usersChanged) {
      setData('sb_users', users);
    }

    /* ── Ensure sb_courses array exists ── */
    var courses = getData('sb_courses') || [];

    var demoCourses = [
      { id: 'c1', userId: 'u1', name: 'Software Engineering',  code: 'SE201',   credits: 4, progress: 67 },
      { id: 'c2', userId: 'u1', name: 'Database Systems',      code: 'CS301',   credits: 3, progress: 50 },
      { id: 'c3', userId: 'u1', name: 'Discrete Mathematics',  code: 'MATH105', credits: 3, progress: 40 },
      { id: 'c4', userId: 'u2', name: 'Web Development',       code: 'WD101',   credits: 3, progress: 75 },
      { id: 'c5', userId: 'u2', name: 'Operating Systems',     code: 'CS401',   credits: 4, progress: 30 },
      { id: 'c6', userId: 'u2', name: 'Computer Networks',     code: 'CN301',   credits: 3, progress: 55 }
    ];

    var existingCourseIds = courses.map(function (c) { return c.id; });
    var coursesChanged    = false;

    demoCourses.forEach(function (dc) {
      if (existingCourseIds.indexOf(dc.id) === -1) {
        courses.push(dc);
        coursesChanged = true;
      }
    });

    if (coursesChanged) {
      setData('sb_courses', courses);
    }

    /* ── Ensure sb_tasks array exists ── */
    var tasks = getData('sb_tasks') || [];

    var demoTasks = [
      { id: 't1',  userId: 'u1', courseId: 'c1', courseName: 'Software Engineering', title: 'Project Proposal',        deadline: offsetDate(1),  priority: 'high',   status: 'pending'    },
      { id: 't2',  userId: 'u1', courseId: 'c2', courseName: 'Database Systems',     title: 'Database Design ERD',     deadline: offsetDate(2),  priority: 'high',   status: 'inprogress' },
      { id: 't3',  userId: 'u1', courseId: 'c3', courseName: 'Discrete Mathematics', title: 'Problem Set 3',           deadline: offsetDate(5),  priority: 'medium', status: 'pending'    },
      { id: 't4',  userId: 'u1', courseId: 'c1', courseName: 'Software Engineering', title: 'Sprint Review Slides',    deadline: offsetDate(-3), priority: 'medium', status: 'completed'  },
      { id: 't5',  userId: 'u1', courseId: 'c2', courseName: 'Database Systems',     title: 'SQL Query Assignment',    deadline: offsetDate(-5), priority: 'low',    status: 'completed'  },
      { id: 't6',  userId: 'u1', courseId: 'c3', courseName: 'Discrete Mathematics', title: 'Research Paper Draft',    deadline: offsetDate(7),  priority: 'medium', status: 'pending'    },
      { id: 't7',  userId: 'u1', courseId: 'c1', courseName: 'Software Engineering', title: 'Unit Testing Report',     deadline: offsetDate(1),  priority: 'high',   status: 'pending'    },
      { id: 't8',  userId: 'u1', courseId: 'c2', courseName: 'Database Systems',     title: 'ER Diagram Revision',     deadline: offsetDate(4),  priority: 'low',    status: 'inprogress' },
      { id: 't9',  userId: 'u2', courseId: 'c4', courseName: 'Web Development',      title: 'Responsive Portfolio Page',deadline: offsetDate(3), priority: 'high',   status: 'inprogress' },
      { id: 't10', userId: 'u2', courseId: 'c5', courseName: 'Operating Systems',    title: 'Process Scheduling Report',deadline: offsetDate(6), priority: 'medium', status: 'pending'    },
      { id: 't11', userId: 'u2', courseId: 'c6', courseName: 'Computer Networks',    title: 'Network Topology Diagram', deadline: offsetDate(-2), priority: 'low',   status: 'completed'  },
      { id: 't12', userId: 'u2', courseId: 'c4', courseName: 'Web Development',      title: 'JavaScript Quiz',          deadline: offsetDate(1),  priority: 'high',  status: 'pending'    }
    ];

    var existingTaskIds = tasks.map(function (t) { return t.id; });
    var tasksChanged    = false;

    demoTasks.forEach(function (dt) {
      if (existingTaskIds.indexOf(dt.id) === -1) {
        tasks.push(dt);
        tasksChanged = true;
      }
    });

    if (tasksChanged) {
      setData('sb_tasks', tasks);
    }

    console.info('StudyBalance: seed check complete.');
  }

  /* ── 9. Auto-init ────────────────────────────────────── */

  // seedData runs immediately (synchronous) so data is always
  // available before any page script or DOMContentLoaded handler runs.
  seedData();

  document.addEventListener('DOMContentLoaded', function () {
    setSidebarActive();
    renderUserChip();
  });

  /* ── Public API ───────────────────────────────────────── */
  return {
    getData,
    setData,
    removeData,
    genId,
    formatDate,
    daysUntil,
    todayISO,
    offsetDate,
    getCurrentUser,
    getToken,
    guardStudent,
    guardAdmin,
    logout,
    setSidebarActive,
    renderUserChip,
    seedData
  };

})();
