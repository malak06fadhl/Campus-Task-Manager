/* ============================================================
   StudyBalance — Admin Pages
   js/admin.js
   Data loaded from backend Admin API.
   Shared by: admin-dashboard.html, manage-users.html,
              manage-task-records.html
   Depends on: js/main.js (SB global)
   ============================================================ */

(function () {
  'use strict';

  var API = 'http://localhost:3000/api';

  /* ── Detect current page via data-page on <body> ─────── */
  var PAGE = document.body.getAttribute('data-page');

  /* ── Filter state (manage-tasks page) ────────────────── */
  var activeStatus   = 'all';
  var activePriority = 'all';
  var searchQuery    = '';

  /* ── In-memory caches so filters don't re-fetch ──────── */
  var cachedUsers = [];
  var cachedTasks = [];

  /* ── Label maps ──────────────────────────────────────── */
  var STATUS_LABELS   = { pending: 'Pending', inprogress: 'In Progress', completed: 'Completed' };
  var PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };

  /* ── API helper ───────────────────────────────────────── */
  function apiFetch(method, path, body) {
    var token = SB.getToken();
    var opts  = {
      method:  method,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
      }
    };
    if (body) opts.body = JSON.stringify(body);
    return fetch(API + path, opts).then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    });
  }

  /* ── Show a full-page error inside a container ────────── */
  function showContainerError(elId, msg) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML =
      '<div class="alert alert-warning" style="margin:16px;">' +
        '<span class="alert-icon">⚠️</span>' +
        '<div>' + escHtml(msg) + '</div>' +
      '</div>';
  }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    if (!SB.guardAdmin()) return;

    bindLogout();

    if (PAGE === 'admin-dashboard') initDashboard();
    else if (PAGE === 'manage-users')  initManageUsers();
    else if (PAGE === 'manage-tasks')  initManageTasks();
  });

  /* ============================================================
     LOGOUT
     ============================================================ */
  function bindLogout() {
    var btn = document.getElementById('adminLogoutBtn');
    if (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        SB.removeData('sb_currentUser');
        SB.removeData('sb_token');
        window.location.replace('../html/admin-login.html');
      });
    }
  }

  /* ============================================================
     PAGE: ADMIN DASHBOARD
     ============================================================ */
  function initDashboard() {
    /* Disable topbar search — not used on dashboard */
    var search = document.getElementById('topbarSearch');
    if (search) search.setAttribute('disabled', 'disabled');

    /* Show loading */
    var summaryEl = document.getElementById('adminSummary');
    if (summaryEl) summaryEl.innerHTML = '<div class="text-muted" style="padding:16px;">Loading…</div>';

    /* Fetch users and tasks in parallel */
    Promise.all([
      apiFetch('GET', '/admin/users'),
      apiFetch('GET', '/admin/tasks')
    ])
    .then(function (results) {
      var usersResult = results[0];
      var tasksResult = results[1];

      if (!usersResult.ok) throw new Error(usersResult.data.error || 'Failed to load users.');
      if (!tasksResult.ok) throw new Error(tasksResult.data.error || 'Failed to load tasks.');

      var users = usersResult.data.users || [];
      var tasks = tasksResult.data.tasks || [];

      var banned = users.filter(function (u) { return u.banned; }).length;

      /* Count unique courses across all users from tasks */
      var courseSet = {};
      tasks.forEach(function (t) { if (t.course_name) courseSet[t.course_name + '|' + (t.student_id || '')] = 1; });

      renderAdminSummary([
        { icon: '👤', value: users.length,    label: 'Total Students', sub: banned + ' banned',           color: 'blue' },
        { icon: '🎓', value: users.length - banned, label: 'Active Students', sub: 'Currently active',   color: 'purple' },
        { icon: '📚', value: users.reduce(function (s, u) { return s + (u.total_courses || 0); }, 0),
                              label: 'Total Courses',  sub: 'Across all students',                        color: 'green' },
        { icon: '✅', value: tasks.length,    label: 'Total Tasks',    sub: 'All tracked activities',     color: 'yellow' }
      ]);

      /* Recent users: last 5 registered */
      renderRecentUsers(users.slice(0, 5));
      renderTaskStatusOverview(tasks);
    })
    .catch(function (err) {
      showContainerError('adminSummary',
        'Could not load dashboard data. Make sure the backend is running. (' + err.message + ')');
    });
  }

  function renderAdminSummary(cards) {
    var el = document.getElementById('adminSummary');
    if (!el) return;
    el.innerHTML = cards.map(function (c) {
      return '<div class="summary-card">' +
        '<div class="summary-icon ' + c.color + '">' + c.icon + '</div>' +
        '<div class="summary-meta">' +
          '<span class="summary-label">' + escHtml(c.label) + '</span>' +
          '<span class="summary-value">' + escHtml(String(c.value)) + '</span>' +
          '<span class="summary-sub">'   + escHtml(c.sub)           + '</span>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderRecentUsers(users) {
    var el = document.getElementById('recentUsersTable');
    if (!el) return;

    if (users.length === 0) {
      el.innerHTML = emptyState('👥', 'No users yet', 'Registered students will appear here.');
      return;
    }

    el.innerHTML =
      '<div class="table-wrapper">' +
        '<table class="data-table">' +
          '<thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>' +
          '<tbody>' +
          users.map(function (u) {
            return '<tr>' +
              '<td class="fw-700">' + escHtml(u.full_name) + '</td>' +
              '<td class="text-muted">' + escHtml(u.email) + '</td>' +
              '<td>' + statusBadge(u.banned) + '</td>' +
            '</tr>';
          }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';
  }

  function renderTaskStatusOverview(tasks) {
    var el = document.getElementById('taskStatusOverview');
    if (!el) return;

    if (tasks.length === 0) {
      el.innerHTML = emptyState('📊', 'No tasks yet', 'Task data will appear here once students add tasks.');
      return;
    }

    var pending    = tasks.filter(function (t) { return t.status === 'pending'; }).length;
    var inprogress = tasks.filter(function (t) { return t.status === 'inprogress'; }).length;
    var completed  = tasks.filter(function (t) { return t.status === 'completed'; }).length;
    var max        = Math.max(pending, inprogress, completed, 1);

    var rows = [
      { label: 'Pending',     value: pending,    color: 'yellow', badge: 'pending' },
      { label: 'In Progress', value: inprogress, color: '',       badge: 'inprogress' },
      { label: 'Completed',   value: completed,  color: 'green',  badge: 'completed' }
    ];

    var html = '<div class="bar-chart">';
    rows.forEach(function (row) {
      var pct = Math.round((row.value / max) * 100);
      html +=
        '<div class="bar-row">' +
          '<span class="bar-label"><span class="badge badge-' + row.badge + '">' + row.label + '</span></span>' +
          '<div class="bar-track"><div class="bar-fill ' + row.color + '" style="width:' + pct + '%;"></div></div>' +
          '<span class="bar-value">' + row.value + '</span>' +
        '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }

  /* ============================================================
     PAGE: MANAGE USERS
     ============================================================ */
  function initManageUsers() {
    loadUsers();

    var search = document.getElementById('topbarSearch');
    if (search) {
      search.addEventListener('input', function () {
        renderUsersTable(search.value.trim());
      });
    }
  }

  function loadUsers() {
    var wrap = document.getElementById('usersTableWrap');
    if (wrap) wrap.innerHTML = '<div class="text-muted" style="padding:16px;">Loading users…</div>';

    apiFetch('GET', '/admin/users')
      .then(function (result) {
        if (!result.ok) throw new Error(result.data.error || 'Failed to load users.');
        cachedUsers = result.data.users || [];
        renderUsersTable('');
      })
      .catch(function (err) {
        showContainerError('usersTableWrap',
          'Could not load users. Make sure the backend is running. (' + err.message + ')');
      });
  }

  function renderUsersTable(query) {
    var wrap  = document.getElementById('usersTableWrap');
    var count = document.getElementById('usersCount');
    if (!wrap) return;

    var students = cachedUsers;

    if (query) {
      var q = query.toLowerCase();
      students = students.filter(function (u) {
        return u.full_name.toLowerCase().includes(q) ||
               u.email.toLowerCase().includes(q);
      });
    }

    if (count) {
      count.textContent = students.length + ' student' + (students.length !== 1 ? 's' : '');
    }

    if (students.length === 0) {
      wrap.innerHTML = emptyState('👥', 'No students found',
        query ? 'Try a different search.' : 'No registered students yet.');
      return;
    }

    var html =
      '<div class="table-wrapper">' +
        '<table class="data-table">' +
          '<thead><tr>' +
            '<th>Name</th><th>Email</th><th>Courses</th><th>Tasks</th><th>Status</th><th>Action</th>' +
          '</tr></thead>' +
          '<tbody>';

    students.forEach(function (u) {
      html +=
        '<tr>' +
          '<td>' +
            '<div class="admin-user-cell">' +
              '<div class="admin-user-avatar">' + escHtml(u.full_name.charAt(0).toUpperCase()) + '</div>' +
              '<div>' +
                '<div class="fw-700">' + escHtml(u.full_name) + '</div>' +
                '<div class="text-muted fs-xs">Student</div>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td class="text-muted">' + escHtml(u.email) + '</td>' +
          '<td><span class="badge badge-inprogress">' + (u.total_courses || 0) + '</span></td>' +
          '<td><span class="badge badge-inprogress">' + (u.total_tasks   || 0) + '</span></td>' +
          '<td>' + statusBadge(u.banned) + '</td>' +
          '<td>' +
            '<button class="btn btn-sm ' + (u.banned ? 'btn-success' : 'btn-danger') + ' ban-btn"' +
                    ' data-id="' + escAttr(u.id) + '">' +
              (u.banned ? '✅ Unban' : '🚫 Ban') +
            '</button>' +
          '</td>' +
        '</tr>';
    });

    html += '</tbody></table></div>';
    wrap.innerHTML = html;

    /* Attach ban/unban listeners */
    wrap.querySelectorAll('.ban-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleBan(btn.getAttribute('data-id'), btn);
      });
    });
  }

  function toggleBan(userId, btn) {
    if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }

    apiFetch('PATCH', '/admin/users/' + userId + '/ban')
      .then(function (result) {
        if (!result.ok) {
          alert(result.data.error || 'Failed to update user status.');
          if (btn) { btn.disabled = false; btn.style.opacity = ''; }
          return;
        }
        /* Update the cached user so re-render is instant */
        cachedUsers = cachedUsers.map(function (u) {
          if (u.id !== userId) return u;
          return Object.assign({}, u, { banned: result.data.user.banned });
        });
        var search = document.getElementById('topbarSearch');
        renderUsersTable(search ? search.value.trim() : '');
      })
      .catch(function () {
        alert('Cannot reach the server. Make sure the backend is running.');
        if (btn) { btn.disabled = false; btn.style.opacity = ''; }
      });
  }

  /* ============================================================
     PAGE: MANAGE TASK RECORDS
     ============================================================ */
  function initManageTasks() {
    loadTasks();

    var search = document.getElementById('topbarSearch');
    if (search) {
      search.addEventListener('input', function () {
        searchQuery = search.value.trim();
        renderTasksTable();
      });
    }

    var tabs = document.getElementById('statusFilterTabs');
    if (tabs) {
      tabs.addEventListener('click', function (e) {
        var tab = e.target.closest('.filter-tab');
        if (!tab) return;
        tabs.querySelectorAll('.filter-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        activeStatus = tab.getAttribute('data-status');
        renderTasksTable();
      });
    }

    var priFilter = document.getElementById('priorityFilter');
    if (priFilter) {
      priFilter.addEventListener('change', function () {
        activePriority = priFilter.value;
        renderTasksTable();
      });
    }
  }

  function loadTasks() {
    var wrap = document.getElementById('tasksTableWrap');
    if (wrap) wrap.innerHTML = '<div class="text-muted" style="padding:16px;">Loading task records…</div>';

    apiFetch('GET', '/admin/tasks')
      .then(function (result) {
        if (!result.ok) throw new Error(result.data.error || 'Failed to load tasks.');
        cachedTasks = result.data.tasks || [];
        renderTasksTable();
      })
      .catch(function (err) {
        showContainerError('tasksTableWrap',
          'Could not load task records. Make sure the backend is running. (' + err.message + ')');
      });
  }

  function renderTasksTable() {
    var wrap  = document.getElementById('tasksTableWrap');
    var count = document.getElementById('tasksCount');
    if (!wrap) return;

    /* Apply filters to cached data */
    var filtered = cachedTasks;

    if (activeStatus !== 'all') {
      filtered = filtered.filter(function (t) { return t.status === activeStatus; });
    }
    if (activePriority !== 'all') {
      filtered = filtered.filter(function (t) { return t.priority === activePriority; });
    }
    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      filtered = filtered.filter(function (t) {
        return t.title.toLowerCase().includes(q) ||
               (t.course_name    || '').toLowerCase().includes(q) ||
               (t.student_name   || '').toLowerCase().includes(q) ||
               (t.student_email  || '').toLowerCase().includes(q);
      });
    }

    if (count) {
      count.textContent = filtered.length + ' record' + (filtered.length !== 1 ? 's' : '');
    }

    if (filtered.length === 0) {
      wrap.innerHTML = emptyState('🗂️', 'No task records found',
        (activeStatus !== 'all' || activePriority !== 'all' || searchQuery)
          ? 'Try adjusting your filters or search.'
          : 'No tasks have been created yet.');
      return;
    }

    var html =
      '<div class="table-wrapper">' +
        '<table class="data-table">' +
          '<thead><tr>' +
            '<th>Task</th><th>Student</th><th>Course</th><th>Deadline</th><th>Priority</th><th>Status</th>' +
          '</tr></thead>' +
          '<tbody>';

    filtered.forEach(function (t) {
      var days    = SB.daysUntil(t.deadline);
      var overdue = t.status !== 'completed' && days !== null && days < 0;

      var deadlineHtml = escHtml(SB.formatDate(t.deadline));
      if (overdue) {
        deadlineHtml += '<div class="admin-overdue-label">⚠️ ' + Math.abs(days) + 'd overdue</div>';
      }

      html +=
        '<tr' + (overdue ? ' class="admin-overdue-row"' : '') + '>' +
          '<td><div class="fw-700">' + escHtml(t.title) + '</div></td>' +
          '<td>' +
            (t.student_name
              ? '<div class="fw-700">' + escHtml(t.student_name) + '</div>' +
                '<div class="text-muted fs-xs">' + escHtml(t.student_email || '') + '</div>'
              : '<span class="text-muted">Unknown</span>') +
          '</td>' +
          '<td class="text-muted">' + escHtml(t.course_name || '—') + '</td>' +
          '<td>' + deadlineHtml + '</td>' +
          '<td><span class="badge badge-' + t.priority + '">' +
            escHtml(PRIORITY_LABELS[t.priority] || t.priority) + '</span></td>' +
          '<td><span class="badge badge-' + t.status + '">' +
            escHtml(STATUS_LABELS[t.status] || t.status) + '</span></td>' +
        '</tr>';
    });

    html += '</tbody></table></div>';
    wrap.innerHTML = html;
  }

  /* ============================================================
     SHARED HELPERS
     ============================================================ */
  function statusBadge(banned) {
    return banned
      ? '<span class="badge badge-high">Banned</span>'
      : '<span class="badge badge-completed">Active</span>';
  }

  function emptyState(icon, title, desc) {
    return '<div class="empty-state">' +
      '<div class="empty-icon">' + icon + '</div>' +
      '<div class="empty-title">' + escHtml(title) + '</div>' +
      '<div class="empty-desc">'  + escHtml(desc)  + '</div>' +
    '</div>';
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escAttr(str) {
    return String(str).replace(/"/g, '&quot;');
  }

})();
