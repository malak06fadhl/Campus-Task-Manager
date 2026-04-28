/* ============================================================
   StudyBalance — Dashboard
   js/dashboard.js
   Data loaded from backend API.
   Depends on: js/main.js (SB global)
   ============================================================ */

(function () {
  'use strict';

  var API = 'http://localhost:3000/api';

  /* ── Priority weight map ──────────────────────────────── */
  var PRIORITY_WEIGHT = { high: 1, medium: 2, low: 3 };

  /* ── Intensity class by task count ───────────────────── */
  function intensityClass(count) {
    if (count === 0) return 'hm-empty';
    if (count === 1) return 'hm-light';
    if (count === 2) return 'hm-moderate';
    if (count <= 4)  return 'hm-busy';
    return 'hm-very-busy';
  }

  /* ── Greeting based on time of day ───────────────────── */
  function greeting(name) {
    var hour = new Date().getHours();
    var part = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    return 'Good ' + part + ', ' + name + '! 👋';
  }

  /* ── API helper ───────────────────────────────────────── */
  function apiFetch(path) {
    var token = SB.getToken();
    return fetch(API + path, {
      headers: {
        'Content-Type':  'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
      }
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || 'API error');
        return data;
      });
    });
  }

  /* ── Normalise API task → shape render functions expect ── */
  function normaliseTask(t) {
    return {
      id:          t.id,
      userId:      t.user_id,
      courseId:    t.course_id   || '',
      courseName:  t.course_name || '',
      title:       t.title,
      description: t.description || '',
      priority:    t.priority,
      status:      t.status,
      deadline:    t.deadline    || ''
    };
  }

  /* ── Normalise API course ── */
  function normaliseCourse(c) {
    return {
      id:       c.id,
      userId:   c.user_id,
      name:     c.name,
      code:     c.code     || '',
      credits:  c.credits,
      progress: c.progress
    };
  }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    if (!SB.guardStudent()) return;

    var user = SB.getCurrentUser();
    renderGreeting(user);

    /* Show loading placeholders */
    setText('statTotal',     '…');
    setText('statCompleted', '…');
    setText('statPending',   '…');
    setText('statUrgent',    '…');

    /* Fetch tasks and courses in parallel */
    Promise.all([
      apiFetch('/tasks'),
      apiFetch('/courses')
    ])
    .then(function (results) {
      var tasks   = (results[0].tasks   || []).map(normaliseTask);
      var courses = (results[1].courses || []).map(normaliseCourse);

      renderSummaryCards(tasks);
      renderPriorityTasks(tasks);
      renderMiniHeatmap(tasks);
      renderCourseProgress(courses);
    })
    .catch(function (err) {
      /* Show error in summary area */
      var grid = document.getElementById('summaryGrid');
      if (grid) {
        grid.innerHTML =
          '<div class="alert alert-warning" style="grid-column:1/-1;">' +
            '<span class="alert-icon">⚠️</span>' +
            '<div>Could not load dashboard data. Make sure the backend is running on port 3000.' +
            (err.message ? ' (' + escHtml(err.message) + ')' : '') + '</div>' +
          '</div>';
      }
    });
  });

  /* ============================================================
     GREETING
     ============================================================ */
  function renderGreeting(user) {
    var el = document.getElementById('heroGreeting');
    if (el) el.textContent = greeting(user.name || 'Student');
  }

  /* ============================================================
     SUMMARY CARDS
     ============================================================ */
  function renderSummaryCards(tasks) {
    var total     = tasks.length;
    var completed = tasks.filter(function (t) { return t.status === 'completed'; }).length;
    var pending   = tasks.filter(function (t) { return t.status === 'pending'; }).length;
    var urgent    = tasks.filter(function (t) {
      if (t.status === 'completed') return false;
      var d = SB.daysUntil(t.deadline);
      return d !== null && d >= 0 && d <= 2;
    }).length;

    setText('statTotal',     total);
    setText('statCompleted', completed);
    setText('statPending',   pending);
    setText('statUrgent',    urgent);

    setText('statCompletedPct', total > 0
      ? Math.round((completed / total) * 100) + '% of total'
      : 'No tasks yet');

    setText('statPendingPct', total > 0
      ? Math.round((pending / total) * 100) + '% remaining'
      : 'No tasks yet');
  }

  /* ============================================================
     PRIORITY TASKS WIDGET
     ============================================================ */
  function renderPriorityTasks(tasks) {
    var container = document.getElementById('priorityTasksList');
    if (!container) return;

    var active = tasks
      .filter(function (t) { return t.status !== 'completed'; })
      .sort(function (a, b) {
        var pw = (PRIORITY_WEIGHT[a.priority] || 9) - (PRIORITY_WEIGHT[b.priority] || 9);
        if (pw !== 0) return pw;
        return (a.deadline || '').localeCompare(b.deadline || '');
      })
      .slice(0, 5);

    if (active.length === 0) {
      container.innerHTML = emptyState('🎉', 'All caught up!', 'No pending tasks right now.');
      return;
    }

    var html = '<div class="priority-list">';
    active.forEach(function (task) {
      var days     = SB.daysUntil(task.deadline);
      var dueLabel = deadlineLabel(days);
      var urgent   = days !== null && days >= 0 && days <= 2;

      html += '<div class="priority-item">';
      html +=   '<div class="priority-item-left">';
      html +=     '<div class="priority-item-title">' + escHtml(task.title) + '</div>';
      html +=     '<div class="priority-item-course">' + escHtml(task.courseName || '') + '</div>';
      html +=   '</div>';
      html +=   '<div class="priority-item-right">';
      html +=     '<span class="badge badge-' + task.priority + '">' + capFirst(task.priority) + '</span>';
      html +=     '<span class="priority-item-deadline' + (urgent ? ' text-red' : '') + '">' + dueLabel + '</span>';
      html +=   '</div>';
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  /* ============================================================
     MINI HEATMAP WIDGET (current week Mon → Sun)
     ============================================================ */
  function renderMiniHeatmap(tasks) {
    var namesEl = document.getElementById('miniHeatmapDayNames');
    var gridEl  = document.getElementById('miniHeatmapGrid');
    if (!namesEl || !gridEl) return;

    var DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    var countMap = {};
    tasks.forEach(function (t) {
      if (!t.deadline) return;
      countMap[t.deadline] = (countMap[t.deadline] || 0) + 1;
    });

    var today   = new Date();
    var dayOfWk = today.getDay();
    var monday  = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWk + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    var todayISO = SB.todayISO();

    namesEl.innerHTML = DAY_NAMES.map(function (n) {
      return '<div class="heatmap-day-name">' + n + '</div>';
    }).join('');

    var gridHtml = '';
    for (var i = 0; i < 7; i++) {
      var d = new Date(monday);
      d.setDate(monday.getDate() + i);
      var iso     = d.toISOString().slice(0, 10);
      var count   = countMap[iso] || 0;
      var cls     = intensityClass(count);
      var isToday = iso === todayISO ? ' today' : '';
      var dayNum  = d.getDate();
      var tip     = count === 0 ? 'No tasks' : count + ' task' + (count > 1 ? 's' : '') + ' due';

      gridHtml += '<div class="heatmap-cell ' + cls + isToday + '" title="' + iso + ': ' + tip + '">';
      gridHtml +=   dayNum;
      gridHtml +=   '<span class="heatmap-tooltip">' + tip + '</span>';
      gridHtml += '</div>';
    }
    gridEl.innerHTML = gridHtml;
  }

  /* ============================================================
     COURSE PROGRESS WIDGET
     ============================================================ */
  function renderCourseProgress(courses) {
    var container = document.getElementById('courseProgressList');
    if (!container) return;

    if (courses.length === 0) {
      container.innerHTML = emptyState('📚', 'No courses yet', '<a href="courses.html">Add your first course →</a>');
      return;
    }

    var top3 = courses.slice(0, 3);
    var FILL_COLORS = ['', 'green', 'purple'];

    var html = '<div style="display:flex;flex-direction:column;gap:16px;">';
    top3.forEach(function (course, idx) {
      var pct   = Math.min(100, Math.max(0, course.progress || 0));
      var color = FILL_COLORS[idx] || '';

      html += '<div>';
      html +=   '<div class="progress-row">';
      html +=     '<span class="progress-label">' + escHtml(course.name) + '</span>';
      html +=     '<span class="progress-pct">' + pct + '%</span>';
      html +=   '</div>';
      html +=   '<div class="progress-track">';
      html +=     '<div class="progress-fill ' + color + '" style="width:' + pct + '%"></div>';
      html +=   '</div>';
      html +=   '<div class="text-muted fs-xs" style="margin-top:4px;">' + escHtml(course.code || '') + ' · ' + (course.credits || 0) + ' credits</div>';
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function capFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function deadlineLabel(days) {
    if (days === null) return '—';
    if (days < 0)   return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return 'Tomorrow';
    return 'In ' + days + ' days';
  }

  function emptyState(icon, title, desc) {
    return '<div class="empty-state">'
      + '<div class="empty-icon">' + icon + '</div>'
      + '<div class="empty-title">' + title + '</div>'
      + '<div class="empty-desc">' + desc + '</div>'
      + '</div>';
  }

})();
