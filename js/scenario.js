/* ============================================================
   StudyBalance — What-If Scenario Simulator
   js/scenario.js
   Data loaded from backend API.
   Depends on: js/main.js (SB global)
   ============================================================ */

(function () {
  'use strict';

  var API = 'http://localhost:3000/api';

  /* ── State ────────────────────────────────────────────── */
  var cachedTasks = [];   // sorted by deadline asc

  /* ── DOM refs ─────────────────────────────────────────── */
  var scenarioForm       = document.getElementById('scenarioForm');
  var scenarioEmpty      = document.getElementById('scenarioEmpty');
  var scenarioTask       = document.getElementById('scenarioTask');
  var currentDeadlineEl  = document.getElementById('currentDeadline');
  var currentDeadlineLbl = document.getElementById('currentDeadlineLabel');
  var proposedDeadlineEl = document.getElementById('proposedDeadline');
  var scenarioResultWrap = document.getElementById('scenarioResultWrap');
  var scenarioFormError  = document.getElementById('scenarioFormError');
  var tasksOverviewTable = document.getElementById('tasksOverviewTable');
  var tasksOverviewCount = document.getElementById('tasksOverviewCount');
  var topbarSearch       = document.getElementById('topbarSearch');

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

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    if (!SB.guardStudent()) return;

    apiFetch('/tasks')
      .then(function (data) {
        cachedTasks = (data.tasks || [])
          .map(normaliseTask)
          .sort(function (a, b) { return (a.deadline || '').localeCompare(b.deadline || ''); });

        if (cachedTasks.length === 0) {
          if (scenarioEmpty) scenarioEmpty.style.display = 'block';
          if (scenarioForm)  scenarioForm.style.display  = 'none';
        } else {
          populateTaskDropdown(cachedTasks);
          renderOverviewTable(cachedTasks, '');
        }

        bindEvents();
      })
      .catch(function (err) {
        if (scenarioForm) {
          scenarioForm.innerHTML =
            '<div class="alert alert-warning">' +
              '<span class="alert-icon">⚠️</span>' +
              '<div>Could not load tasks. Make sure the backend is running on port 3000.' +
              (err.message ? ' (' + escHtml(err.message) + ')' : '') + '</div>' +
            '</div>';
        }
        bindEvents();
      });
  });

  /* ============================================================
     POPULATE TASK DROPDOWN
     ============================================================ */
  function populateTaskDropdown(tasks) {
    if (!scenarioTask) return;

    var html   = '<option value="">— Choose a task —</option>';
    var groups = {};

    tasks.forEach(function (t) {
      var key = t.courseName || 'Uncategorised';
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    Object.keys(groups).sort().forEach(function (courseName) {
      html += '<optgroup label="' + escAttr(courseName) + '">';
      groups[courseName].forEach(function (t) {
        var daysLeft = SB.daysUntil(t.deadline);
        var suffix   = daysLeft === null ? ''
          : daysLeft < 0  ? ' (overdue)'
          : daysLeft === 0 ? ' (today)'
          : ' (' + daysLeft + 'd)';
        html += '<option value="' + escAttr(t.id) + '">' + escHtml(t.title) + suffix + '</option>';
      });
      html += '</optgroup>';
    });

    scenarioTask.innerHTML = html;
  }

  /* ============================================================
     ANALYZE
     ============================================================ */
  function analyze(e) {
    e.preventDefault();
    clearError();

    var taskId   = scenarioTask.value;
    var proposed = proposedDeadlineEl.value;

    if (!taskId) { showError('Please select a task to simulate.'); scenarioTask.focus(); return; }
    if (!proposed) { showError('Please enter a proposed new deadline.'); proposedDeadlineEl.focus(); return; }

    var targetTask = cachedTasks.find(function (t) { return t.id === taskId; });
    if (!targetTask) { showError('Selected task not found. Please refresh the page.'); return; }

    var current = targetTask.deadline;
    if (!current) { showError('The selected task has no current deadline set.'); return; }
    if (proposed === current) { showError('The proposed deadline is the same as the current deadline.'); return; }

    var curMonday  = getWeekMonday(current);
    var curSunday  = getWeekSunday(current);
    var propMonday = getWeekMonday(proposed);
    var propSunday = getWeekSunday(proposed);

    var curCount  = countTasksInWeek(cachedTasks, curMonday,  curSunday,  targetTask.id);
    var propCount = countTasksInWeek(cachedTasks, propMonday, propSunday, targetTask.id);

    var propTotal = propCount + 1;
    var curTotal  = curCount  + 1;

    renderResult({
      task: targetTask, current: current, proposed: proposed,
      curMonday: curMonday, curSunday: curSunday,
      propMonday: propMonday, propSunday: propSunday,
      curTotal: curTotal, propTotal: propTotal,
      isWarning: propTotal > curTotal,
      isSame:    propTotal === curTotal
    });
  }

  /* ============================================================
     RENDER RESULT
     ============================================================ */
  function renderResult(r) {
    if (!scenarioResultWrap) return;

    var cardClass = r.isWarning ? 'warning' : 'safe';
    var icon      = r.isWarning ? '⚠️' : '✅';
    var headline  = r.isWarning ? 'Workload Increases' : r.isSame ? 'Workload Unchanged' : 'Workload Decreases';

    var recommendation = r.isWarning
      ? 'Moving <strong>' + escHtml(r.task.title) + '</strong> to ' + escHtml(SB.formatDate(r.proposed)) +
        ' adds it to a busier week. Consider choosing a later date or completing other tasks first.'
      : r.isSame
        ? 'The proposed week has the same number of tasks. This change is neutral.'
        : 'Moving <strong>' + escHtml(r.task.title) + '</strong> to ' + escHtml(SB.formatDate(r.proposed)) +
          ' moves it to a lighter week. This is a safe adjustment.';

    var daysChange = SB.daysUntil(r.proposed) - SB.daysUntil(r.current);
    var daysLabel  = daysChange > 0 ? '+' + daysChange + ' day' + (Math.abs(daysChange) !== 1 ? 's' : '') + ' later'
                   : daysChange < 0 ? Math.abs(daysChange) + ' day' + (Math.abs(daysChange) !== 1 ? 's' : '') + ' earlier'
                   : 'Same day';

    scenarioResultWrap.innerHTML =
      '<div class="result-card ' + cardClass + '">' +
        '<div class="result-card-header">' +
          '<div class="result-card-icon">' + icon + '</div>' +
          '<div>' +
            '<div class="result-card-title">' + headline + '</div>' +
            '<div class="result-card-sub">' + escHtml(r.task.title) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="result-stats">' +
          resultStat(r.curTotal,  'Tasks in current week',  SB.formatDate(r.curMonday) + ' – ' + SB.formatDate(r.curSunday)) +
          resultStat(r.propTotal, 'Tasks in proposed week', SB.formatDate(r.propMonday) + ' – ' + SB.formatDate(r.propSunday)) +
        '</div>' +
        '<div class="result-change-row">' +
          '<div class="result-change-item"><span class="result-change-label">Current deadline</span><span class="result-change-value">' + escHtml(SB.formatDate(r.current)) + '</span></div>' +
          '<div class="result-change-arrow">→</div>' +
          '<div class="result-change-item"><span class="result-change-label">Proposed deadline</span><span class="result-change-value">' + escHtml(SB.formatDate(r.proposed)) + '</span></div>' +
          '<div class="result-change-item"><span class="result-change-label">Shift</span><span class="result-change-value">' + escHtml(daysLabel) + '</span></div>' +
        '</div>' +
        '<div class="alert alert-' + (r.isWarning ? 'warning' : 'success') + '" style="margin-top:16px;">' +
          '<span class="alert-icon">' + icon + '</span><div>' + recommendation + '</div>' +
        '</div>' +
      '</div>';

    scenarioResultWrap.classList.add('show');
    scenarioResultWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function resultStat(value, label, sub) {
    return '<div class="result-stat">' +
      '<div class="result-stat-value">' + escHtml(String(value)) + '</div>' +
      '<div class="result-stat-label">' + escHtml(label) + '</div>' +
      (sub ? '<div class="result-stat-sub">' + escHtml(sub) + '</div>' : '') +
    '</div>';
  }

  /* ============================================================
     TASKS OVERVIEW TABLE
     ============================================================ */
  function renderOverviewTable(tasks, query) {
    if (!tasksOverviewTable) return;

    var filtered = tasks;
    if (query) {
      var q = query.toLowerCase();
      filtered = tasks.filter(function (t) {
        return t.title.toLowerCase().includes(q) || (t.courseName || '').toLowerCase().includes(q);
      });
    }

    if (tasksOverviewCount) {
      tasksOverviewCount.textContent = filtered.length + ' task' + (filtered.length !== 1 ? 's' : '');
    }

    if (filtered.length === 0) {
      tasksOverviewTable.innerHTML =
        '<div class="empty-state" style="padding:32px;">' +
          '<div class="empty-icon">🔍</div>' +
          '<div class="empty-title">No tasks match</div>' +
          '<div class="empty-desc">Try a different search term.</div>' +
        '</div>';
      return;
    }

    var PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };
    var STATUS_LABELS   = { pending: 'Pending', inprogress: 'In Progress', completed: 'Completed' };

    var html =
      '<div class="table-wrapper"><table class="data-table">' +
        '<thead><tr><th>Task</th><th>Course</th><th>Deadline</th><th>Days Left</th><th>Priority</th><th>Status</th></tr></thead>' +
        '<tbody>';

    filtered.forEach(function (t) {
      var days     = SB.daysUntil(t.deadline);
      var daysText = days === null ? '—'
        : days < 0  ? '<span class="text-red fw-700">' + Math.abs(days) + 'd overdue</span>'
        : days === 0 ? '<span class="text-red fw-700">Today</span>'
        : days === 1 ? '<span class="text-yellow fw-700">Tomorrow</span>'
        : days + ' days';

      html +=
        '<tr>' +
          '<td><span class="fw-700">' + escHtml(t.title) + '</span></td>' +
          '<td class="text-muted">' + escHtml(t.courseName || '—') + '</td>' +
          '<td>' + escHtml(SB.formatDate(t.deadline)) + '</td>' +
          '<td>' + daysText + '</td>' +
          '<td><span class="badge badge-' + t.priority + '">' + escHtml(PRIORITY_LABELS[t.priority] || t.priority) + '</span></td>' +
          '<td><span class="badge badge-' + t.status + '">' + escHtml(STATUS_LABELS[t.status] || t.status) + '</span></td>' +
        '</tr>';
    });

    html += '</tbody></table></div>';
    tasksOverviewTable.innerHTML = html;
  }

  /* ============================================================
     EVENT BINDING
     ============================================================ */
  function bindEvents() {
    if (scenarioTask) {
      scenarioTask.addEventListener('change', function () {
        clearError();
        if (scenarioResultWrap) scenarioResultWrap.classList.remove('show');

        var taskId = scenarioTask.value;
        if (!taskId) {
          if (currentDeadlineEl)  currentDeadlineEl.value       = '';
          if (currentDeadlineLbl) currentDeadlineLbl.textContent = '';
          return;
        }

        var task = cachedTasks.find(function (t) { return t.id === taskId; });
        if (!task) return;

        if (currentDeadlineEl) currentDeadlineEl.value = task.deadline || '';

        var days = SB.daysUntil(task.deadline);
        if (currentDeadlineLbl) {
          currentDeadlineLbl.textContent = task.deadline
            ? SB.formatDate(task.deadline) + (days !== null
                ? (days < 0 ? ' · ' + Math.abs(days) + 'd overdue' : days === 0 ? ' · Due today' : ' · ' + days + ' days left')
                : '')
            : '';
        }

        if (proposedDeadlineEl && !proposedDeadlineEl.value && task.deadline) {
          var parts = task.deadline.split('-').map(Number);
          var d     = new Date(parts[0], parts[1] - 1, parts[2]);
          d.setDate(d.getDate() + 7);
          proposedDeadlineEl.value = toISO(d);
        }
      });
    }

    if (scenarioForm) scenarioForm.addEventListener('submit', analyze);

    if (topbarSearch) {
      topbarSearch.addEventListener('input', function () {
        renderOverviewTable(cachedTasks, topbarSearch.value.trim());
      });
    }
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function getWeekMonday(isoDate) {
    var parts = isoDate.split('-').map(Number);
    var d     = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return toISO(d);
  }

  function getWeekSunday(isoDate) {
    var monday = getWeekMonday(isoDate);
    var parts  = monday.split('-').map(Number);
    var d      = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + 6);
    return toISO(d);
  }

  function countTasksInWeek(tasks, monday, sunday, excludeId) {
    return tasks.filter(function (t) {
      if (t.id === excludeId || !t.deadline) return false;
      return t.deadline >= monday && t.deadline <= sunday;
    }).length;
  }

  function toISO(d) {
    var y  = d.getFullYear();
    var m  = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
  }

  function showError(msg) {
    if (!scenarioFormError) return;
    scenarioFormError.textContent = msg;
    scenarioFormError.classList.add('show');
  }

  function clearError() {
    if (!scenarioFormError) return;
    scenarioFormError.textContent = '';
    scenarioFormError.classList.remove('show');
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function escAttr(str) {
    return String(str).replace(/"/g,'&quot;');
  }

})();
