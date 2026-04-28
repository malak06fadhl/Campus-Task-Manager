/* ============================================================
   StudyBalance — Analytics
   js/analytics.js
   Data loaded from backend API.
   Depends on: js/main.js (SB global)
   ============================================================ */

(function () {
  'use strict';

  var API = 'http://localhost:3000/api';

  /* ── DOM refs ─────────────────────────────────────────── */
  var analyticsSummary      = document.getElementById('analyticsSummary');
  var insightCards          = document.getElementById('insightCards');
  var chartStatus           = document.getElementById('chartStatus');
  var chartPriority         = document.getElementById('chartPriority');
  var chartCourse           = document.getElementById('chartCourse');
  var courseProgressSection = document.getElementById('courseProgressSection');

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

  /* ── Normalise API task ── */
  function normaliseTask(t) {
    return {
      id:         t.id,
      courseId:   t.course_id   || '',
      courseName: t.course_name || '',
      title:      t.title,
      priority:   t.priority,
      status:     t.status,
      deadline:   t.deadline    || ''
    };
  }

  /* ── Normalise API course ── */
  function normaliseCourse(c) {
    return {
      id:       c.id,
      name:     c.name,
      code:     c.code     || '',
      credits:  c.credits,
      progress: c.progress
    };
  }

  /* ── Show error in a container ── */
  function showContainerError(el, msg) {
    if (!el) return;
    el.innerHTML =
      '<div class="empty-state" style="padding:32px;">' +
        '<div class="empty-icon">⚠️</div>' +
        '<div class="empty-title">Could not load data</div>' +
        '<div class="empty-desc">' + escHtml(msg) + '</div>' +
      '</div>';
  }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    if (!SB.guardStudent()) return;

    /* Loading placeholders */
    if (analyticsSummary) analyticsSummary.innerHTML = '<div class="text-muted" style="padding:16px;">Loading…</div>';

    Promise.all([
      apiFetch('/tasks'),
      apiFetch('/courses')
    ])
    .then(function (results) {
      var tasks   = (results[0].tasks   || []).map(normaliseTask);
      var courses = (results[1].courses || []).map(normaliseCourse);

      renderSummaryCards(tasks);
      renderInsightCards(tasks, courses);
      renderStatusChart(tasks);
      renderPriorityChart(tasks);
      renderCourseChart(tasks, courses);
      renderCourseProgress(courses);

      setTimeout(animateBars, 80);
    })
    .catch(function (err) {
      var msg = 'Could not load analytics. Make sure the backend is running on port 3000.' +
                (err.message ? ' (' + err.message + ')' : '');
      showContainerError(analyticsSummary, msg);
      showContainerError(insightCards, '');
      showContainerError(chartStatus, msg);
      showContainerError(chartPriority, msg);
      showContainerError(chartCourse, msg);
      showContainerError(courseProgressSection, msg);
    });
  });

  /* ============================================================
     SUMMARY CARDS
     ============================================================ */
  function renderSummaryCards(tasks) {
    if (!analyticsSummary) return;

    var total     = tasks.length;
    var completed = tasks.filter(function (t) { return t.status === 'completed'; }).length;
    var highPri   = tasks.filter(function (t) { return t.priority === 'high'; }).length;
    var overdue   = tasks.filter(function (t) {
      if (t.status === 'completed') return false;
      var d = SB.daysUntil(t.deadline);
      return d !== null && d < 0;
    }).length;

    var rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    analyticsSummary.innerHTML =
      summaryCard('📋', total,       'Total Tasks',     'blue',   'All tracked tasks') +
      summaryCard('✅', rate + '%',  'Completion Rate', 'green',  completed + ' of ' + total + ' done') +
      summaryCard('🔴', highPri,     'High Priority',   'red',    'Needs attention') +
      summaryCard('⏰', overdue,     'Overdue Tasks',   overdue > 0 ? 'red' : 'green',
                                                        overdue > 0 ? 'Past deadline' : 'None overdue');
  }

  function summaryCard(icon, value, label, color, sub) {
    return '<div class="summary-card">' +
      '<div class="summary-icon ' + color + '">' + icon + '</div>' +
      '<div class="summary-meta">' +
        '<span class="summary-label">' + escHtml(label) + '</span>' +
        '<span class="summary-value">' + escHtml(String(value)) + '</span>' +
        '<span class="summary-sub">' + escHtml(sub) + '</span>' +
      '</div>' +
    '</div>';
  }

  /* ============================================================
     INSIGHT CARDS
     ============================================================ */
  function renderInsightCards(tasks, courses) {
    if (!insightCards) return;

    if (tasks.length === 0) {
      insightCards.innerHTML = '';
      return;
    }

    var insights = [];

    /* Most loaded course */
    var courseTaskCount = {};
    tasks.forEach(function (t) {
      if (!t.courseId) return;
      courseTaskCount[t.courseId] = (courseTaskCount[t.courseId] || 0) + 1;
    });
    var mostLoadedId = null, mostLoadedCount = 0;
    Object.keys(courseTaskCount).forEach(function (id) {
      if (courseTaskCount[id] > mostLoadedCount) {
        mostLoadedCount = courseTaskCount[id];
        mostLoadedId    = id;
      }
    });
    if (mostLoadedId) {
      var mlCourse = courses.find(function (c) { return c.id === mostLoadedId; });
      insights.push({
        icon: '📚', color: 'blue', title: 'Most Loaded Course',
        body: (mlCourse ? escHtml(mlCourse.name) : 'Unknown') +
              ' has <strong>' + mostLoadedCount + ' task' + (mostLoadedCount !== 1 ? 's' : '') + '</strong>.'
      });
    }

    /* Best progress course */
    var bestCourse = null, bestPct = -1;
    courses.forEach(function (c) {
      var pct = parseInt(c.progress, 10) || 0;
      if (pct > bestPct) { bestPct = pct; bestCourse = c; }
    });
    if (bestCourse && bestPct > 0) {
      insights.push({
        icon: '🏆', color: 'green', title: 'Best Progress',
        body: escHtml(bestCourse.name) + ' is at <strong>' + bestPct + '%</strong> completion.'
      });
    }

    /* High priority risk */
    var highPending = tasks.filter(function (t) {
      return t.priority === 'high' && t.status !== 'completed';
    }).length;
    if (highPending >= 3) {
      insights.push({
        icon: '⚠️', color: 'red', title: 'High Priority Risk',
        body: 'You have <strong>' + highPending + ' high-priority tasks</strong> not yet completed.'
      });
    }

    /* Overdue warning */
    var overdueCount = tasks.filter(function (t) {
      if (t.status === 'completed') return false;
      var d = SB.daysUntil(t.deadline);
      return d !== null && d < 0;
    }).length;
    if (overdueCount > 0) {
      insights.push({
        icon: '🚨', color: 'red', title: 'Overdue Warning',
        body: '<strong>' + overdueCount + ' task' + (overdueCount !== 1 ? 's are' : ' is') +
              ' overdue.</strong> Review your task list.'
      });
    }

    /* On track */
    if (overdueCount === 0 && highPending < 3) {
      insights.push({
        icon: '🎉', color: 'green', title: 'On Track',
        body: 'No overdue tasks and manageable high-priority workload. Keep it up!'
      });
    }

    /* Completion rate */
    var total     = tasks.length;
    var completed = tasks.filter(function (t) { return t.status === 'completed'; }).length;
    var rate      = total > 0 ? Math.round((completed / total) * 100) : 0;
    if (rate >= 75) {
      insights.push({
        icon: '⭐', color: 'yellow', title: 'Great Completion Rate',
        body: 'You\'ve completed <strong>' + rate + '%</strong> of your tasks. Excellent work!'
      });
    } else if (rate > 0 && rate < 30) {
      insights.push({
        icon: '📌', color: 'yellow', title: 'Low Completion Rate',
        body: 'Only <strong>' + rate + '%</strong> of tasks completed. Try breaking tasks into smaller steps.'
      });
    }

    var html = '<div class="insights-grid">';
    insights.slice(0, 4).forEach(function (ins) {
      html +=
        '<div class="insight-card insight-' + ins.color + '">' +
          '<div class="insight-icon">' + ins.icon + '</div>' +
          '<div class="insight-body">' +
            '<div class="insight-title">' + ins.title + '</div>' +
            '<div class="insight-text">' + ins.body + '</div>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    insightCards.innerHTML = html;
  }

  /* ============================================================
     CHARTS
     ============================================================ */
  function renderBarChart(container, rows, max) {
    if (!container) return;
    if (rows.length === 0 || max === 0) {
      container.innerHTML =
        '<div class="empty-state" style="padding:32px;">' +
          '<div class="empty-icon">📊</div>' +
          '<div class="empty-title">No data yet</div>' +
          '<div class="empty-desc">Add tasks to see chart data.</div>' +
        '</div>';
      return;
    }
    var html = '<div class="bar-chart">';
    rows.forEach(function (row) {
      var pct = max > 0 ? Math.round((row.value / max) * 100) : 0;
      html +=
        '<div class="bar-row">' +
          '<span class="bar-label">' +
            (row.badge
              ? '<span class="badge badge-' + row.badge + '" style="margin-right:6px;">' + escHtml(row.label) + '</span>'
              : escHtml(row.label)) +
          '</span>' +
          '<div class="bar-track">' +
            '<div class="bar-fill ' + (row.color || '') + '" style="width:0%;" data-target="' + pct + '"></div>' +
          '</div>' +
          '<span class="bar-value">' + row.value + '</span>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function renderStatusChart(tasks) {
    var pending    = tasks.filter(function (t) { return t.status === 'pending'; }).length;
    var inprogress = tasks.filter(function (t) { return t.status === 'inprogress'; }).length;
    var completed  = tasks.filter(function (t) { return t.status === 'completed'; }).length;
    renderBarChart(chartStatus, [
      { label: 'Pending',     value: pending,    color: 'yellow', badge: 'pending' },
      { label: 'In Progress', value: inprogress, color: '',       badge: 'inprogress' },
      { label: 'Completed',   value: completed,  color: 'green',  badge: 'completed' }
    ], Math.max(pending, inprogress, completed, 1));
  }

  function renderPriorityChart(tasks) {
    var high   = tasks.filter(function (t) { return t.priority === 'high'; }).length;
    var medium = tasks.filter(function (t) { return t.priority === 'medium'; }).length;
    var low    = tasks.filter(function (t) { return t.priority === 'low'; }).length;
    renderBarChart(chartPriority, [
      { label: 'High',   value: high,   color: 'red',    badge: 'high' },
      { label: 'Medium', value: medium, color: 'yellow', badge: 'medium' },
      { label: 'Low',    value: low,    color: 'green',  badge: 'low' }
    ], Math.max(high, medium, low, 1));
  }

  function renderCourseChart(tasks, courses) {
    if (!chartCourse) return;
    if (courses.length === 0) {
      chartCourse.innerHTML =
        '<div class="empty-state" style="padding:32px;">' +
          '<div class="empty-icon">📚</div>' +
          '<div class="empty-title">No courses yet</div>' +
          '<div class="empty-desc"><a href="courses.html">Add courses</a> to see this chart.</div>' +
        '</div>';
      return;
    }
    var courseColors = ['', 'green', 'purple', 'yellow', 'red', 'muted'];
    var rows = courses.map(function (c, idx) {
      var count = tasks.filter(function (t) { return t.courseId === c.id; }).length;
      return { label: c.name + (c.code ? ' (' + c.code + ')' : ''), value: count, color: courseColors[idx % courseColors.length] };
    });
    rows.sort(function (a, b) { return b.value - a.value; });
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; }));
    renderBarChart(chartCourse, rows, Math.max(max, 1));
  }

  function renderCourseProgress(courses) {
    if (!courseProgressSection) return;
    if (courses.length === 0) {
      courseProgressSection.innerHTML =
        '<div class="empty-state" style="padding:32px;">' +
          '<div class="empty-icon">📚</div>' +
          '<div class="empty-title">No courses yet</div>' +
          '<div class="empty-desc"><a href="courses.html">Add your first course →</a></div>' +
        '</div>';
      return;
    }
    var sorted = courses.slice().sort(function (a, b) {
      return (parseInt(b.progress, 10) || 0) - (parseInt(a.progress, 10) || 0);
    });
    var FILL_COLORS = ['', 'green', 'purple', 'yellow', 'red'];
    var html = '<div class="course-progress-list">';
    sorted.forEach(function (course, idx) {
      var pct   = Math.min(100, Math.max(0, parseInt(course.progress, 10) || 0));
      var color = FILL_COLORS[idx % FILL_COLORS.length];
      var statusLabel = pct >= 100 ? 'Completed' : pct >= 75 ? 'Almost done' : pct >= 50 ? 'Halfway' : pct >= 25 ? 'In progress' : 'Just started';
      html +=
        '<div class="course-progress-row">' +
          '<div class="course-progress-info">' +
            '<div class="course-progress-name">' + escHtml(course.name) + '</div>' +
            '<div class="course-progress-meta">' + escHtml(course.code || '') +
              (course.credits ? ' · ' + course.credits + ' credits' : '') +
              ' · <span class="text-muted">' + statusLabel + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="course-progress-bar-wrap">' +
            '<div class="progress-track">' +
              '<div class="progress-fill ' + color + '" style="width:' + pct + '%;"></div>' +
            '</div>' +
          '</div>' +
          '<div class="course-progress-pct">' + pct + '%</div>' +
        '</div>';
    });
    html += '</div>';
    courseProgressSection.innerHTML = html;
  }

  function animateBars() {
    document.querySelectorAll('.bar-fill[data-target]').forEach(function (el) {
      el.style.width = el.getAttribute('data-target') + '%';
    });
  }

  /* ── Helpers ── */
  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();
