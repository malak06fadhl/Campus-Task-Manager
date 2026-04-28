/* ============================================================
   StudyBalance — Academic Heatmap
   js/heatmap.js
   Data loaded from backend API.
   Depends on: js/main.js (SB global)
   ============================================================ */

(function () {
  'use strict';

  var API = 'http://localhost:3000/api';

  /* ── State ────────────────────────────────────────────── */
  var cachedTasks  = [];
  var viewYear     = 0;
  var viewMonth    = 0;
  var selectedDate = null;
  var searchQuery  = '';

  /* ── Constants ────────────────────────────────────────── */
  var DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

  /* ── DOM refs ─────────────────────────────────────────── */
  var monthNavTitle   = document.getElementById('monthNavTitle');
  var heatmapGrid     = document.getElementById('heatmapGrid');
  var heatmapDayNames = document.getElementById('heatmapDayNames');
  var heatmapSummary  = document.getElementById('heatmapSummary');
  var heatmapDetail   = document.getElementById('heatmapDetail');
  var weeklySummary   = document.getElementById('weeklySummary');
  var topbarSearch    = document.getElementById('topbarSearch');

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

    var now   = new Date();
    viewYear  = now.getFullYear();
    viewMonth = now.getMonth();

    bindEvents();

    /* Show loading state */
    if (heatmapGrid) heatmapGrid.innerHTML = '<div class="text-muted" style="padding:16px;text-align:center;">Loading…</div>';

    apiFetch('/tasks')
      .then(function (data) {
        cachedTasks = (data.tasks || []).map(normaliseTask);
        renderAll();
      })
      .catch(function (err) {
        if (heatmapGrid) {
          heatmapGrid.innerHTML =
            '<div class="alert alert-warning" style="margin:16px;">' +
              '<span class="alert-icon">⚠️</span>' +
              '<div>Could not load tasks. Make sure the backend is running on port 3000.' +
              (err.message ? ' (' + escHtml(err.message) + ')' : '') + '</div>' +
            '</div>';
        }
      });
  });

  /* ============================================================
     DATA HELPERS
     ============================================================ */
  function buildDayMap(tasks) {
    var map = {};
    tasks.forEach(function (t) {
      if (!t.deadline) return;
      if (searchQuery) {
        var q = searchQuery.toLowerCase();
        if (!t.title.toLowerCase().includes(q) &&
            !(t.courseName || '').toLowerCase().includes(q)) return;
      }
      if (!map[t.deadline]) map[t.deadline] = [];
      map[t.deadline].push(t);
    });
    return map;
  }

  function intensityClass(count) {
    if (count === 0) return 'hm-empty';
    if (count === 1) return 'hm-light';
    if (count === 2) return 'hm-moderate';
    if (count === 3) return 'hm-busy';
    return 'hm-very-busy';
  }

  function toISO(d) {
    var y  = d.getFullYear();
    var m  = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
  }

  /* ============================================================
     RENDER ALL
     ============================================================ */
  function renderAll() {
    var dayMap = buildDayMap(cachedTasks);
    renderMonthTitle();
    renderDayNames();
    renderGrid(dayMap);
    renderSummaryCards(cachedTasks, dayMap);
    renderWeeklySummary(cachedTasks);
    if (selectedDate) renderDayDetail(selectedDate, dayMap[selectedDate] || []);
  }

  function renderMonthTitle() {
    if (monthNavTitle) monthNavTitle.textContent = MONTH_NAMES[viewMonth] + ' ' + viewYear;
  }

  function renderDayNames() {
    if (!heatmapDayNames) return;
    heatmapDayNames.innerHTML = DAY_NAMES_SHORT.map(function (n) {
      return '<div class="heatmap-day-name">' + n + '</div>';
    }).join('');
  }

  function renderGrid(dayMap) {
    if (!heatmapGrid) return;

    var todayISO  = SB.todayISO();
    var firstDay  = new Date(viewYear, viewMonth, 1);
    var lastDay   = new Date(viewYear, viewMonth + 1, 0);
    var startDow  = firstDay.getDay();
    var totalDays = lastDay.getDate();
    var cells     = '';

    for (var i = 0; i < startDow; i++) {
      cells += '<div class="heatmap-cell hm-empty other-month"></div>';
    }

    for (var d = 1; d <= totalDays; d++) {
      var date      = new Date(viewYear, viewMonth, d);
      var iso       = toISO(date);
      var dayTasks  = dayMap[iso] || [];
      var count     = dayTasks.length;
      var cls       = intensityClass(count);
      var isToday   = iso === todayISO ? ' today' : '';
      var isSelected= iso === selectedDate ? ' selected-day' : '';
      var tip       = count === 0 ? 'No tasks' : count + ' task' + (count !== 1 ? 's' : '') + ' due';

      cells +=
        '<div class="heatmap-cell ' + cls + isToday + isSelected + '"' +
            ' data-date="' + iso + '" role="button" tabindex="0"' +
            ' aria-label="' + iso + ': ' + tip + '">' +
          d +
          '<span class="heatmap-tooltip">' + tip + '</span>' +
        '</div>';
    }

    var remainder = (startDow + totalDays) % 7;
    if (remainder !== 0) {
      for (var j = 0; j < (7 - remainder); j++) {
        cells += '<div class="heatmap-cell hm-empty other-month"></div>';
      }
    }

    heatmapGrid.innerHTML = cells;

    heatmapGrid.querySelectorAll('.heatmap-cell[data-date]').forEach(function (cell) {
      cell.addEventListener('click', function () {
        selectDay(cell.getAttribute('data-date'), dayMap);
      });
      cell.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectDay(cell.getAttribute('data-date'), dayMap);
        }
      });
    });
  }

  function selectDay(date, dayMap) {
    selectedDate = date;
    heatmapGrid.querySelectorAll('.heatmap-cell').forEach(function (c) { c.classList.remove('selected-day'); });
    var target = heatmapGrid.querySelector('[data-date="' + date + '"]');
    if (target) target.classList.add('selected-day');
    renderDayDetail(date, dayMap[date] || []);
  }

  function renderDayDetail(date, tasks) {
    if (!heatmapDetail) return;

    var formatted = SB.formatDate(date);
    var days      = SB.daysUntil(date);
    var daysLabel = days === 0  ? '<span class="badge badge-inprogress">Today</span>'
                  : days === 1  ? '<span class="badge badge-medium">Tomorrow</span>'
                  : days < 0   ? '<span class="badge badge-high">' + Math.abs(days) + 'd ago</span>'
                  :               '<span class="badge badge-low">In ' + days + ' days</span>';

    var html =
      '<div class="heatmap-detail-header">' +
        '<div>' +
          '<div class="heatmap-detail-date">' + escHtml(formatted) + '</div>' +
          '<div style="margin-top:6px;">' + daysLabel + '</div>' +
        '</div>' +
        '<span class="badge ' + intensityClass(tasks.length) + '-badge">' +
          tasks.length + ' task' + (tasks.length !== 1 ? 's' : '') +
        '</span>' +
      '</div>';

    if (tasks.length === 0) {
      html += '<div class="empty-state" style="padding:32px 16px;">' +
        '<div class="empty-icon">🎉</div>' +
        '<div class="empty-title">Free day!</div>' +
        '<div class="empty-desc">No tasks due on this date.</div>' +
      '</div>';
    } else {
      html += '<div class="heatmap-detail-list">';
      tasks.forEach(function (task) {
        html +=
          '<div class="heatmap-detail-task">' +
            '<div class="heatmap-detail-task-left">' +
              '<div class="heatmap-detail-task-title">' + escHtml(task.title) + '</div>' +
              '<div class="heatmap-detail-task-course">📚 ' + escHtml(task.courseName || '—') + '</div>' +
            '</div>' +
            '<div class="heatmap-detail-task-right">' +
              '<span class="badge badge-' + task.priority + '">' + capFirst(task.priority) + '</span>' +
              '<span class="badge badge-' + task.status + '">' + statusLabel(task.status) + '</span>' +
            '</div>' +
          '</div>';
      });
      html += '</div>';
    }
    heatmapDetail.innerHTML = html;
  }

  function renderSummaryCards(allTasks, dayMap) {
    if (!heatmapSummary) return;

    var monthPrefix   = viewYear + '-' + String(viewMonth + 1).padStart(2, '0');
    var monthTasks    = allTasks.filter(function (t) { return t.deadline && t.deadline.startsWith(monthPrefix); });
    var totalMonth    = monthTasks.length;
    var completedMonth= monthTasks.filter(function (t) { return t.status === 'completed'; }).length;

    var busiestCount = 0, busiestDate = null;
    Object.keys(dayMap).forEach(function (iso) {
      if (!iso.startsWith(monthPrefix)) return;
      var c = dayMap[iso].length;
      if (c > busiestCount) { busiestCount = c; busiestDate = iso; }
    });

    var veryBusyDays = Object.keys(dayMap).filter(function (iso) {
      return iso.startsWith(monthPrefix) && dayMap[iso].length >= 4;
    }).length;

    heatmapSummary.innerHTML =
      summaryCard('📋', totalMonth, totalMonth === 1 ? 'Task This Month' : 'Tasks This Month', 'blue') +
      summaryCard('🔥', busiestDate ? busiestCount + ' tasks' : '—',
        busiestDate ? 'Busiest: ' + SB.formatDate(busiestDate) : 'Busiest Day', 'red') +
      summaryCard('⚡', veryBusyDays, veryBusyDays === 1 ? 'Very Busy Day' : 'Very Busy Days', 'yellow') +
      summaryCard('✅', completedMonth, 'Completed This Month', 'green');
  }

  function summaryCard(icon, value, label, color) {
    return '<div class="summary-card">' +
      '<div class="summary-icon ' + color + '">' + icon + '</div>' +
      '<div class="summary-meta">' +
        '<span class="summary-label">' + escHtml(label) + '</span>' +
        '<span class="summary-value">' + escHtml(String(value)) + '</span>' +
      '</div>' +
    '</div>';
  }

  function renderWeeklySummary(allTasks) {
    if (!weeklySummary) return;

    var today  = new Date();
    var dow    = today.getDay();
    var monday = new Date(today);
    monday.setDate(today.getDate() - ((dow + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    var DAY_FULL = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    var todayISO = SB.todayISO();
    var maxCount = 0;
    var weekData = [];

    for (var i = 0; i < 7; i++) {
      var d   = new Date(monday);
      d.setDate(monday.getDate() + i);
      var iso      = toISO(d);
      var dayTasks = allTasks.filter(function (t) { return t.deadline === iso; });
      weekData.push({ iso: iso, name: DAY_FULL[i], count: dayTasks.length });
      if (dayTasks.length > maxCount) maxCount = dayTasks.length;
    }

    if (maxCount === 0) {
      weeklySummary.innerHTML =
        '<div class="empty-state" style="padding:32px;">' +
          '<div class="empty-icon">🗓️</div>' +
          '<div class="empty-title">No tasks this week</div>' +
          '<div class="empty-desc">Enjoy the free week, or add tasks on the Tasks page.</div>' +
        '</div>';
      return;
    }

    var rows = '<div class="weekly-summary-grid">';
    weekData.forEach(function (day) {
      var isToday = day.iso === todayISO;
      var barPct  = maxCount > 0 ? Math.round((day.count / maxCount) * 100) : 0;
      var cls     = intensityClass(day.count);
      rows +=
        '<div class="weekly-row' + (isToday ? ' weekly-row-today' : '') + '">' +
          '<div class="weekly-day-name">' + day.name.slice(0, 3) +
            (isToday ? ' <span class="badge badge-inprogress" style="font-size:0.65rem;padding:2px 6px;">Today</span>' : '') +
          '</div>' +
          '<div class="weekly-bar-wrap">' +
            '<div class="bar-track">' +
              '<div class="bar-fill ' + cls + '-fill" style="width:' + barPct + '%;"></div>' +
            '</div>' +
          '</div>' +
          '<div class="weekly-count"><span class="badge ' + cls + '">' + day.count + '</span></div>' +
        '</div>';
    });
    rows += '</div>';
    weeklySummary.innerHTML = rows;
  }

  /* ============================================================
     EVENT BINDING
     ============================================================ */
  function bindEvents() {
    var prevBtn  = document.getElementById('prevMonthBtn');
    var nextBtn  = document.getElementById('nextMonthBtn');
    var todayBtn = document.getElementById('todayBtn');

    if (prevBtn) prevBtn.addEventListener('click', function () {
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      selectedDate = null;
      renderAll();
    });

    if (nextBtn) nextBtn.addEventListener('click', function () {
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      selectedDate = null;
      renderAll();
    });

    if (todayBtn) todayBtn.addEventListener('click', function () {
      var now   = new Date();
      viewYear  = now.getFullYear();
      viewMonth = now.getMonth();
      selectedDate = SB.todayISO();
      renderAll();
    });

    if (topbarSearch) topbarSearch.addEventListener('input', function () {
      searchQuery  = topbarSearch.value.trim();
      selectedDate = null;
      renderAll();
    });
  }

  /* ── Helpers ── */
  function statusLabel(s) {
    return s === 'inprogress' ? 'In Progress' : s === 'completed' ? 'Completed' : 'Pending';
  }
  function capFirst(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }
  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();
