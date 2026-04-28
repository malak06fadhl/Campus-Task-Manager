/* ============================================================
   StudyBalance — Task Management
   js/tasks.js
   Data now comes from the backend API.
   localStorage is used only for sb_token / sb_currentUser.
   Depends on: js/main.js (SB global)
   ============================================================ */

(function () {
  'use strict';

  /* ── Config ───────────────────────────────────────────── */
  var API = 'http://localhost:3000/api';

  /* ── State ────────────────────────────────────────────── */
  var currentUser   = null;
  var editingId     = null;
  var pendingDelete = null;
  var cachedTasks   = [];   // in-memory cache for edit/delete lookups
  var cachedCourses = [];   // for course dropdown

  /* Active filter state */
  var activeStatus   = 'all';
  var activePriority = 'all';
  var activeSort     = 'deadline-asc';
  var searchQuery    = '';

  /* ── Priority / status helpers ────────────────────────── */
  var PRIORITY_WEIGHT = { high: 1, medium: 2, low: 3 };

  var STATUS_LABELS = {
    pending:    'Pending',
    inprogress: 'In Progress',
    completed:  'Completed'
  };

  var PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };

  /* ── DOM refs ─────────────────────────────────────────── */
  var tasksList          = document.getElementById('tasksList');
  var summaryStrip       = document.getElementById('tasksSummaryStrip');
  var topbarSearch       = document.getElementById('topbarSearch');
  var statusTabs         = document.getElementById('statusTabs');
  var priorityFilter     = document.getElementById('priorityFilter');
  var sortSelect         = document.getElementById('sortSelect');

  var taskModal          = document.getElementById('taskModal');
  var taskModalTitle     = document.getElementById('taskModalTitle');
  var taskForm           = document.getElementById('taskForm');
  var taskFormError      = document.getElementById('taskFormError');
  var taskIdField        = document.getElementById('taskId');
  var taskTitleField     = document.getElementById('taskTitle');
  var taskCourseField    = document.getElementById('taskCourse');
  var taskPriorityField  = document.getElementById('taskPriority');
  var taskStatusField    = document.getElementById('taskStatus');
  var taskDeadlineField  = document.getElementById('taskDeadline');
  var taskDescField      = document.getElementById('taskDescription');

  var taskDeleteModal    = document.getElementById('taskDeleteModal');
  var deleteTaskName     = document.getElementById('deleteTaskName');
  var taskDeleteConfirm  = document.getElementById('taskDeleteConfirm');

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    if (!SB.guardStudent()) return;
    currentUser = SB.getCurrentUser();
    bindEvents();
    loadAll();
  });

  /* ============================================================
     API HELPERS
     ============================================================ */
  function authHeader() {
    var token = SB.getToken();
    return token ? { 'Authorization': 'Bearer ' + token } : {};
  }

  function apiFetch(method, path, body) {
    var opts = {
      method:  method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader())
    };
    if (body) opts.body = JSON.stringify(body);
    return fetch(API + path, opts).then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    });
  }

  /* ── Normalise API task row → shape render functions expect ── */
  function normaliseTask(t) {
    return {
      id:          t.id,
      userId:      t.user_id,
      courseId:    t.course_id    || '',
      courseName:  t.course_name  || '',
      courseCode:  t.course_code  || '',
      title:       t.title,
      description: t.description  || '',
      priority:    t.priority,
      status:      t.status,
      deadline:    t.deadline     || '',
      createdAt:   t.created_at   || ''
    };
  }

  /* ── Normalise API course row ── */
  function normaliseCourse(c) {
    return {
      id:       c.id,
      userId:   c.user_id,
      name:     c.name,
      code:     c.code       || '',
      credits:  c.credits,
      progress: c.progress
    };
  }

  /* ============================================================
     LOAD ALL (tasks + courses in parallel)
     ============================================================ */
  function loadAll() {
    showListLoading();

    Promise.all([
      apiFetch('GET', '/tasks'),
      apiFetch('GET', '/courses')
    ])
    .then(function (results) {
      var tasksResult   = results[0];
      var coursesResult = results[1];

      if (!tasksResult.ok) {
        throw new Error(tasksResult.data.error || 'Failed to load tasks.');
      }
      if (!coursesResult.ok) {
        throw new Error(coursesResult.data.error || 'Failed to load courses.');
      }

      cachedTasks   = (tasksResult.data.tasks   || []).map(normaliseTask);
      cachedCourses = (coursesResult.data.courses || []).map(normaliseCourse);

      renderSummaryStrip(cachedTasks);
      renderTasksList(cachedTasks);
    })
    .catch(function (err) {
      if (tasksList) {
        tasksList.innerHTML =
          '<div class="empty-state">' +
            '<div class="empty-icon">⚠️</div>' +
            '<div class="empty-title">Could not load tasks</div>' +
            '<div class="empty-desc">' + escHtml(err.message) + '</div>' +
          '</div>';
      }
    });
  }

  function showListLoading() {
    if (tasksList) {
      tasksList.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">⏳</div>' +
          '<div class="empty-title">Loading tasks…</div>' +
        '</div>';
    }
  }

  /* ============================================================
     RENDER
     ============================================================ */

  /* ── Summary strip ── */
  function renderSummaryStrip(tasks) {
    if (!summaryStrip) return;

    var total      = tasks.length;
    var completed  = tasks.filter(function (t) { return t.status === 'completed'; }).length;
    var inprogress = tasks.filter(function (t) { return t.status === 'inprogress'; }).length;
    var pending    = tasks.filter(function (t) { return t.status === 'pending'; }).length;
    var urgent     = tasks.filter(function (t) {
      if (t.status === 'completed') return false;
      var d = SB.daysUntil(t.deadline);
      return d !== null && d >= 0 && d <= 2;
    }).length;

    summaryStrip.innerHTML =
      '<div class="courses-strip-inner" style="margin-bottom:0;">' +
        stripStat('📋', total,      'Total',       'blue') +
        stripStat('⏳', pending,    'Pending',     'yellow') +
        stripStat('🔄', inprogress, 'In Progress', 'blue') +
        stripStat('✅', completed,  'Completed',   'green') +
        stripStat('🚨', urgent,     'Urgent',      'red') +
      '</div>';
  }

  function stripStat(icon, value, label, color) {
    return '<div class="strip-stat">' +
      '<span class="strip-stat-icon">' + icon + '</span>' +
      '<div class="strip-stat-body">' +
        '<span class="strip-stat-value" style="color:var(--' + color + ');">' + value + '</span>' +
        '<span class="strip-stat-label">' + label + '</span>' +
      '</div>' +
    '</div>';
  }

  /* ── Tasks list ── */
  function renderTasksList(allTasks) {
    if (!tasksList) return;

    /* 1. Filter by status */
    var filtered = activeStatus === 'all'
      ? allTasks
      : allTasks.filter(function (t) { return t.status === activeStatus; });

    /* 2. Filter by priority */
    if (activePriority !== 'all') {
      filtered = filtered.filter(function (t) { return t.priority === activePriority; });
    }

    /* 3. Filter by search query */
    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      filtered = filtered.filter(function (t) {
        return t.title.toLowerCase().includes(q) ||
               (t.courseName || '').toLowerCase().includes(q) ||
               (t.description || '').toLowerCase().includes(q);
      });
    }

    /* 4. Sort */
    filtered = sortTasks(filtered, activeSort);

    /* 5. Render */
    if (filtered.length === 0) {
      var isFiltered = activeStatus !== 'all' || activePriority !== 'all' || searchQuery;
      tasksList.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">' + (isFiltered ? '🔍' : '✅') + '</div>' +
          '<div class="empty-title">' + (isFiltered ? 'No tasks match your filters' : 'No tasks yet') + '</div>' +
          '<div class="empty-desc">' +
            (isFiltered
              ? 'Try adjusting your filters or search query.'
              : 'Add your first task to start tracking your academic workload.') +
          '</div>' +
          (!isFiltered
            ? '<button class="btn btn-primary" style="margin-top:16px;" id="emptyAddTaskBtn">+ Add Task</button>'
            : '') +
        '</div>';

      var emptyBtn = document.getElementById('emptyAddTaskBtn');
      if (emptyBtn) emptyBtn.addEventListener('click', function () { openTaskModal(null); });
      return;
    }

    var html = '';
    filtered.forEach(function (task) {
      html += buildTaskCard(task);
    });
    tasksList.innerHTML = html;

    /* Attach edit / delete listeners */
    tasksList.querySelectorAll('.task-edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id   = btn.getAttribute('data-id');
        var task = cachedTasks.find(function (t) { return t.id === id; });
        if (task) openTaskModal(task);
      });
    });

    tasksList.querySelectorAll('.task-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id   = btn.getAttribute('data-id');
        var task = cachedTasks.find(function (t) { return t.id === id; });
        if (task) openDeleteModal(task);
      });
    });
  }

  function buildTaskCard(task) {
    var days     = SB.daysUntil(task.deadline);
    var dueLabel = deadlineLabel(days);
    var isUrgent = task.status !== 'completed' && days !== null && days >= 0 && days <= 2;
    var isOverdue= task.status !== 'completed' && days !== null && days < 0;

    var accentColor = task.priority === 'high'
      ? 'var(--red)'
      : task.priority === 'medium'
        ? 'var(--yellow)'
        : 'var(--green)';

    return '<div class="task-card" style="border-left:4px solid ' + accentColor + ';">' +

      '<div class="task-card-left">' +
        '<div class="task-title">' + escHtml(task.title) + '</div>' +
        '<div class="task-course">📚 ' + escHtml(task.courseName || '—') + '</div>' +
        (task.description
          ? '<div class="task-desc">' + escHtml(task.description) + '</div>'
          : '') +
      '</div>' +

      '<div class="task-card-right">' +
        '<span class="task-deadline' + (isUrgent ? ' urgent' : '') + (isOverdue ? ' overdue' : '') + '">' +
          '📅 ' + escHtml(SB.formatDate(task.deadline)) +
          '<span class="task-days-label">' + escHtml(dueLabel) + '</span>' +
        '</span>' +
        '<span class="badge badge-' + task.priority + '">' +
          escHtml(PRIORITY_LABELS[task.priority] || task.priority) +
        '</span>' +
        '<span class="badge badge-' + task.status + '">' +
          escHtml(STATUS_LABELS[task.status] || task.status) +
        '</span>' +
        '<div class="task-card-btns">' +
          '<button class="btn btn-ghost btn-sm task-edit-btn"    data-id="' + escAttr(task.id) + '">✏️ Edit</button>' +
          '<button class="btn btn-danger btn-sm task-delete-btn" data-id="' + escAttr(task.id) + '">🗑️</button>' +
        '</div>' +
      '</div>' +

    '</div>';
  }

  /* ── Sort ── */
  function sortTasks(tasks, mode) {
    var sorted = tasks.slice();
    if (mode === 'deadline-asc') {
      sorted.sort(function (a, b) { return (a.deadline || '').localeCompare(b.deadline || ''); });
    } else if (mode === 'deadline-desc') {
      sorted.sort(function (a, b) { return (b.deadline || '').localeCompare(a.deadline || ''); });
    } else if (mode === 'priority') {
      sorted.sort(function (a, b) {
        return (PRIORITY_WEIGHT[a.priority] || 9) - (PRIORITY_WEIGHT[b.priority] || 9);
      });
    } else if (mode === 'title') {
      sorted.sort(function (a, b) { return a.title.localeCompare(b.title); });
    }
    return sorted;
  }

  /* ============================================================
     TASK MODAL — open / close / save
     ============================================================ */
  function openTaskModal(task) {
    clearFormError();
    editingId = task ? task.id : null;

    populateCourseDropdown(task ? task.courseId : null);

    taskModalTitle.textContent = task ? 'Edit Task' : 'Add Task';
    taskIdField.value          = task ? task.id : '';
    taskTitleField.value       = task ? task.title : '';
    taskPriorityField.value    = task ? task.priority : '';
    taskStatusField.value      = task ? task.status : '';
    taskDeadlineField.value    = task ? (task.deadline || '') : '';
    taskDescField.value        = task ? (task.description || '') : '';

    taskModal.classList.add('open');
    taskTitleField.focus();
  }

  function populateCourseDropdown(selectedCourseId) {
    var html = '<option value="">— Select a course —</option>';
    if (cachedCourses.length === 0) {
      html = '<option value="">No courses — add one first</option>';
    } else {
      cachedCourses.forEach(function (c) {
        var sel = selectedCourseId === c.id ? ' selected' : '';
        html += '<option value="' + escAttr(c.id) + '"' + sel + '>' +
          escHtml(c.name) + ' (' + escHtml(c.code || '') + ')' +
        '</option>';
      });
    }
    taskCourseField.innerHTML = html;
  }

  function closeTaskModal() {
    taskModal.classList.remove('open');
    taskForm.reset();
    editingId = null;
    clearFormError();
  }

  function saveTask(e) {
    e.preventDefault();
    clearFormError();

    var title    = taskTitleField.value.trim();
    var courseId = taskCourseField.value;
    var priority = taskPriorityField.value;
    var status   = taskStatusField.value;
    var deadline = taskDeadlineField.value;
    var desc     = taskDescField.value.trim();

    /* Client-side validation */
    if (!title) {
      showFormError('Task title is required.');
      taskTitleField.focus();
      return;
    }
    if (!courseId) {
      showFormError('Please select a course.');
      taskCourseField.focus();
      return;
    }
    if (!priority) {
      showFormError('Please select a priority.');
      taskPriorityField.focus();
      return;
    }
    if (!status) {
      showFormError('Please select a status.');
      taskStatusField.focus();
      return;
    }
    if (!deadline) {
      showFormError('Please set a deadline.');
      taskDeadlineField.focus();
      return;
    }

    var saveBtn = document.getElementById('taskModalSave');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.style.opacity = '0.7'; }

    var payload = {
      title:       title,
      course_id:   courseId,
      priority:    priority,
      status:      status,
      deadline:    deadline,
      description: desc
    };

    var method = editingId ? 'PUT' : 'POST';
    var path   = editingId ? '/tasks/' + editingId : '/tasks';

    apiFetch(method, path, payload)
      .then(function (result) {
        if (!result.ok) {
          showFormError(result.data.error || 'Failed to save task.');
          if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = ''; }
          return;
        }
        closeTaskModal();
        loadAll();
      })
      .catch(function () {
        showFormError('Cannot reach the server. Make sure the backend is running.');
        if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = ''; }
      });
  }

  /* ============================================================
     DELETE MODAL — open / close / confirm
     ============================================================ */
  function openDeleteModal(task) {
    pendingDelete = task.id;
    deleteTaskName.textContent = task.title;
    taskDeleteModal.classList.add('open');
  }

  function closeDeleteModal() {
    taskDeleteModal.classList.remove('open');
    pendingDelete = null;
  }

  function confirmDelete() {
    if (!pendingDelete) return;

    var confirmBtn = document.getElementById('taskDeleteConfirm');
    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.style.opacity = '0.7'; }

    apiFetch('DELETE', '/tasks/' + pendingDelete)
      .then(function (result) {
        if (!result.ok) {
          closeDeleteModal();
          alert(result.data.error || 'Failed to delete task.');
          return;
        }
        closeDeleteModal();
        loadAll();
      })
      .catch(function () {
        closeDeleteModal();
        alert('Cannot reach the server. Make sure the backend is running.');
      })
      .finally(function () {
        if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.style.opacity = ''; }
      });
  }

  /* ============================================================
     EVENT BINDING
     ============================================================ */
  function bindEvents() {
    var addBtn = document.getElementById('addTaskBtn');
    if (addBtn) addBtn.addEventListener('click', function () { openTaskModal(null); });

    var closeBtn  = document.getElementById('taskModalClose');
    var cancelBtn = document.getElementById('taskModalCancel');
    if (closeBtn)  closeBtn.addEventListener('click', closeTaskModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeTaskModal);
    if (taskModal) {
      taskModal.addEventListener('click', function (e) {
        if (e.target === taskModal) closeTaskModal();
      });
    }

    if (taskForm) taskForm.addEventListener('submit', saveTask);

    var delClose  = document.getElementById('taskDeleteClose');
    var delCancel = document.getElementById('taskDeleteCancel');
    if (delClose)  delClose.addEventListener('click', closeDeleteModal);
    if (delCancel) delCancel.addEventListener('click', closeDeleteModal);
    if (taskDeleteModal) {
      taskDeleteModal.addEventListener('click', function (e) {
        if (e.target === taskDeleteModal) closeDeleteModal();
      });
    }
    if (taskDeleteConfirm) taskDeleteConfirm.addEventListener('click', confirmDelete);

    if (statusTabs) {
      statusTabs.addEventListener('click', function (e) {
        var tab = e.target.closest('.filter-tab');
        if (!tab) return;
        statusTabs.querySelectorAll('.filter-tab').forEach(function (t) {
          t.classList.remove('active');
        });
        tab.classList.add('active');
        activeStatus = tab.getAttribute('data-status');
        renderTasksList(cachedTasks);
      });
    }

    if (priorityFilter) {
      priorityFilter.addEventListener('change', function () {
        activePriority = priorityFilter.value;
        renderTasksList(cachedTasks);
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        activeSort = sortSelect.value;
        renderTasksList(cachedTasks);
      });
    }

    if (topbarSearch) {
      topbarSearch.addEventListener('input', function () {
        searchQuery = topbarSearch.value.trim();
        renderTasksList(cachedTasks);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (taskModal      && taskModal.classList.contains('open'))      closeTaskModal();
        if (taskDeleteModal && taskDeleteModal.classList.contains('open')) closeDeleteModal();
      }
    });
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function deadlineLabel(days) {
    if (days === null) return '';
    if (days < 0)   return '(' + Math.abs(days) + 'd overdue)';
    if (days === 0) return '(Due today)';
    if (days === 1) return '(Tomorrow)';
    return '(' + days + ' days left)';
  }

  function showFormError(msg) {
    if (!taskFormError) return;
    taskFormError.textContent = msg;
    taskFormError.classList.add('show');
  }

  function clearFormError() {
    if (!taskFormError) return;
    taskFormError.textContent = '';
    taskFormError.classList.remove('show');
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
