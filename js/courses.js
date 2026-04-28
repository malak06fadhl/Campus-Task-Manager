/* ============================================================
   StudyBalance — Courses Page
   js/courses.js
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
  var cachedCourses = [];   // in-memory cache so edit/delete can find objects

  /* ── Course icon colours (cycle through) ─────────────── */
  var ICON_COLORS = [
    { bg: 'var(--blue-soft)',   color: 'var(--blue)' },
    { bg: 'var(--green-soft)',  color: 'var(--green)' },
    { bg: 'var(--purple-soft)', color: 'var(--purple)' },
    { bg: 'var(--yellow-soft)', color: 'var(--yellow)' },
    { bg: 'var(--red-soft)',    color: 'var(--red)' }
  ];

  /* ── DOM refs ─────────────────────────────────────────── */
  var coursesGrid         = document.getElementById('coursesGrid');
  var summaryStrip        = document.getElementById('coursesSummaryStrip');
  var topbarSearch        = document.getElementById('topbarSearch');

  var courseModal         = document.getElementById('courseModal');
  var courseModalTitle    = document.getElementById('courseModalTitle');
  var courseForm          = document.getElementById('courseForm');
  var courseFormError     = document.getElementById('courseFormError');
  var courseIdField       = document.getElementById('courseId');
  var courseNameField     = document.getElementById('courseName');
  var courseCodeField     = document.getElementById('courseCode');
  var courseCreditsField  = document.getElementById('courseCredits');
  var courseInstrField    = document.getElementById('courseInstructor');
  var courseProgressField = document.getElementById('courseProgress');
  var courseProgressLabel = document.getElementById('courseProgressLabel');

  var deleteModal         = document.getElementById('deleteModal');
  var deleteCourseName    = document.getElementById('deleteCourseName');
  var deleteModalConfirm  = document.getElementById('deleteModalConfirm');

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    if (!SB.guardStudent()) return;
    currentUser = SB.getCurrentUser();
    bindEvents();
    loadAndRender();
  });

  /* ============================================================
     API HELPERS
     ============================================================ */

  /** Return the Authorization header object for fetch calls */
  function authHeader() {
    var token = SB.getToken();
    return token ? { 'Authorization': 'Bearer ' + token } : {};
  }

  /**
   * Fetch all courses for the current user from the API.
   * Returns a Promise that resolves to an array of normalised course objects.
   */
  function fetchCourses() {
    return fetch(API + '/courses', {
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader())
    })
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || 'Failed to load courses.');
        return data.courses.map(normaliseCourse);
      });
    });
  }

  /**
   * Normalise the API snake_case shape to the camelCase shape
   * the render functions already expect.
   */
  function normaliseCourse(c) {
    return {
      id:         c.id,
      userId:     c.user_id,
      name:       c.name,
      code:       c.code       || '',
      instructor: c.instructor || '',
      credits:    c.credits,
      progress:   c.progress,
      createdAt:  c.created_at || ''
    };
  }

  /* ============================================================
     LOAD + RENDER
     ============================================================ */

  function loadAndRender(filterText) {
    /* Show a loading state while fetching */
    if (coursesGrid) {
      coursesGrid.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1;">' +
          '<div class="empty-icon">⏳</div>' +
          '<div class="empty-title">Loading courses…</div>' +
        '</div>';
    }

    fetchCourses()
      .then(function (courses) {
        cachedCourses = courses;

        /* Task count from localStorage (Step 5 will migrate tasks too) */
        var allTasks = SB.getData('sb_tasks') || [];
        var tasks    = allTasks.filter(function (t) { return t.userId === currentUser.id; });
        var countMap = buildTaskCountMap(tasks);

        var query   = (filterText || (topbarSearch ? topbarSearch.value : '')).trim().toLowerCase();
        var visible = query
          ? courses.filter(function (c) {
              return c.name.toLowerCase().includes(query) ||
                     c.code.toLowerCase().includes(query) ||
                     c.instructor.toLowerCase().includes(query);
            })
          : courses;

        renderSummaryStrip(courses, tasks);
        renderGrid(visible, countMap);
      })
      .catch(function (err) {
        if (coursesGrid) {
          coursesGrid.innerHTML =
            '<div class="empty-state" style="grid-column:1/-1;">' +
              '<div class="empty-icon">⚠️</div>' +
              '<div class="empty-title">Could not load courses</div>' +
              '<div class="empty-desc">' + escHtml(err.message) + '</div>' +
            '</div>';
        }
      });
  }

  /* ── Task count map (from localStorage until Step 5) ── */
  function buildTaskCountMap(tasks) {
    var map = {};
    tasks.forEach(function (t) {
      var key = t.courseId || t.course_id;
      if (key) map[key] = (map[key] || 0) + 1;
    });
    return map;
  }

  /* ── Summary strip ── */
  function renderSummaryStrip(courses, tasks) {
    if (!summaryStrip) return;

    var totalCredits = courses.reduce(function (sum, c) {
      return sum + (parseInt(c.credits, 10) || 0);
    }, 0);

    var avgProgress = courses.length
      ? Math.round(courses.reduce(function (sum, c) {
          return sum + (parseInt(c.progress, 10) || 0);
        }, 0) / courses.length)
      : 0;

    var completedCourses = courses.filter(function (c) {
      return parseInt(c.progress, 10) >= 100;
    }).length;

    summaryStrip.innerHTML =
      '<div class="courses-strip-inner">' +
        stripStat('📚', courses.length, 'Total Courses') +
        stripStat('🎓', totalCredits, 'Total Credits') +
        stripStat('📈', avgProgress + '%', 'Avg Progress') +
        stripStat('✅', completedCourses, 'Completed') +
        stripStat('📝', tasks.length, 'Total Tasks') +
      '</div>';
  }

  function stripStat(icon, value, label) {
    return '<div class="strip-stat">' +
      '<span class="strip-stat-icon">' + icon + '</span>' +
      '<div class="strip-stat-body">' +
        '<span class="strip-stat-value">' + value + '</span>' +
        '<span class="strip-stat-label">' + label + '</span>' +
      '</div>' +
    '</div>';
  }

  /* ── Courses grid ── */
  function renderGrid(courses, countMap) {
    if (!coursesGrid) return;

    if (courses.length === 0) {
      coursesGrid.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1;">' +
          '<div class="empty-icon">📚</div>' +
          '<div class="empty-title">No courses yet</div>' +
          '<div class="empty-desc">Add your first course to start tracking your academic progress.</div>' +
          '<button class="btn btn-primary" style="margin-top:16px;" id="emptyAddBtn">+ Add Course</button>' +
        '</div>';

      var emptyBtn = document.getElementById('emptyAddBtn');
      if (emptyBtn) emptyBtn.addEventListener('click', function () { openCourseModal(null); });
      return;
    }

    var html = '';
    courses.forEach(function (course, idx) {
      var color     = ICON_COLORS[idx % ICON_COLORS.length];
      var pct       = Math.min(100, Math.max(0, parseInt(course.progress, 10) || 0));
      var taskCount = countMap[course.id] || 0;
      var initial   = (course.name || '?').charAt(0).toUpperCase();

      html +=
        '<div class="course-card" data-id="' + escAttr(course.id) + '">' +

          '<div class="course-card-header">' +
            '<div class="course-icon" style="background:' + color.bg + ';color:' + color.color + ';">' +
              initial +
            '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div class="course-name">' + escHtml(course.name) + '</div>' +
              '<div class="course-meta">' +
                '<span class="course-meta-item">Code: <span>' + escHtml(course.code || '—') + '</span></span>' +
                '<span class="course-meta-item">Credits: <span>' + escHtml(String(course.credits || '—')) + '</span></span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          (course.instructor
            ? '<div class="course-instructor">👨‍🏫 ' + escHtml(course.instructor) + '</div>'
            : '') +

          '<div class="course-task-count">' +
            '<span class="badge badge-inprogress">' + taskCount + ' task' + (taskCount !== 1 ? 's' : '') + '</span>' +
          '</div>' +

          '<div class="course-progress-section">' +
            '<div class="progress-row">' +
              '<span class="progress-label fs-sm">Progress</span>' +
              '<span class="progress-pct">' + pct + '%</span>' +
            '</div>' +
            '<div class="progress-track">' +
              '<div class="progress-fill" style="width:' + pct + '%;background:' + color.color + ';"></div>' +
            '</div>' +
          '</div>' +

          '<div class="course-card-actions">' +
            '<button class="btn btn-ghost btn-sm course-edit-btn" data-id="' + escAttr(course.id) + '">✏️ Edit</button>' +
            '<button class="btn btn-danger btn-sm course-delete-btn" data-id="' + escAttr(course.id) + '">🗑️ Delete</button>' +
          '</div>' +

        '</div>';
    });

    coursesGrid.innerHTML = html;

    /* Attach edit / delete listeners */
    coursesGrid.querySelectorAll('.course-edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id     = btn.getAttribute('data-id');
        var course = cachedCourses.find(function (c) { return c.id === id; });
        if (course) openCourseModal(course);
      });
    });

    coursesGrid.querySelectorAll('.course-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id     = btn.getAttribute('data-id');
        var course = cachedCourses.find(function (c) { return c.id === id; });
        if (course) openDeleteModal(course);
      });
    });
  }

  /* ============================================================
     COURSE MODAL — open / close / save
     ============================================================ */
  function openCourseModal(course) {
    clearFormError();
    editingId = course ? course.id : null;

    courseModalTitle.textContent    = course ? 'Edit Course' : 'Add Course';
    courseIdField.value             = course ? course.id : '';
    courseNameField.value           = course ? course.name : '';
    courseCodeField.value           = course ? (course.code || '') : '';
    courseCreditsField.value        = course ? (course.credits || '') : '';
    courseInstrField.value          = course ? (course.instructor || '') : '';

    var pct = course ? (parseInt(course.progress, 10) || 0) : 0;
    courseProgressField.value       = pct;
    courseProgressLabel.textContent = pct;

    courseModal.classList.add('open');
    courseNameField.focus();
  }

  function closeCourseModal() {
    courseModal.classList.remove('open');
    courseForm.reset();
    courseProgressLabel.textContent = '0';
    editingId = null;
    clearFormError();
  }

  function saveCourse(e) {
    e.preventDefault();
    clearFormError();

    var name     = courseNameField.value.trim();
    var code     = courseCodeField.value.trim();
    var credits  = parseInt(courseCreditsField.value, 10);
    var instr    = courseInstrField.value.trim();
    var progress = parseInt(courseProgressField.value, 10) || 0;

    /* Client-side validation */
    if (!name) {
      showFormError('Course name is required.');
      courseNameField.focus();
      return;
    }
    if (!code) {
      showFormError('Course code is required.');
      courseCodeField.focus();
      return;
    }
    if (!credits || credits < 1 || credits > 12) {
      showFormError('Please enter valid credit hours (1–12).');
      courseCreditsField.focus();
      return;
    }

    var saveBtn = document.getElementById('courseModalSave');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.style.opacity = '0.7'; }

    var payload = { name: name, code: code, instructor: instr, credits: credits, progress: progress };
    var url     = editingId ? API + '/courses/' + editingId : API + '/courses';
    var method  = editingId ? 'PUT' : 'POST';

    fetch(url, {
      method:  method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader()),
      body:    JSON.stringify(payload)
    })
    .then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    })
    .then(function (result) {
      if (!result.ok) {
        showFormError(result.data.error || 'Failed to save course.');
        if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = ''; }
        return;
      }
      closeCourseModal();
      loadAndRender();
    })
    .catch(function () {
      showFormError('Cannot reach the server. Make sure the backend is running.');
      if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = ''; }
    });
  }

  /* ============================================================
     DELETE MODAL — open / close / confirm
     ============================================================ */
  function openDeleteModal(course) {
    pendingDelete = course.id;
    deleteCourseName.textContent = course.name;
    deleteModal.classList.add('open');
  }

  function closeDeleteModal() {
    deleteModal.classList.remove('open');
    pendingDelete = null;
  }

  function confirmDelete() {
    if (!pendingDelete) return;

    var confirmBtn = document.getElementById('deleteModalConfirm');
    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.style.opacity = '0.7'; }

    fetch(API + '/courses/' + pendingDelete, {
      method:  'DELETE',
      headers: authHeader()
    })
    .then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function (result) {
      if (!result.ok) {
        closeDeleteModal();
        alert(result.data.error || 'Failed to delete course.');
        return;
      }
      closeDeleteModal();
      loadAndRender();
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
    var addBtn = document.getElementById('addCourseBtn');
    if (addBtn) addBtn.addEventListener('click', function () { openCourseModal(null); });

    var closeBtn  = document.getElementById('courseModalClose');
    var cancelBtn = document.getElementById('courseModalCancel');
    if (closeBtn)  closeBtn.addEventListener('click', closeCourseModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeCourseModal);

    if (courseModal) {
      courseModal.addEventListener('click', function (e) {
        if (e.target === courseModal) closeCourseModal();
      });
    }

    if (courseForm) courseForm.addEventListener('submit', saveCourse);

    if (courseProgressField) {
      courseProgressField.addEventListener('input', function () {
        courseProgressLabel.textContent = courseProgressField.value;
      });
    }

    var delClose  = document.getElementById('deleteModalClose');
    var delCancel = document.getElementById('deleteModalCancel');
    if (delClose)  delClose.addEventListener('click', closeDeleteModal);
    if (delCancel) delCancel.addEventListener('click', closeDeleteModal);

    if (deleteModal) {
      deleteModal.addEventListener('click', function (e) {
        if (e.target === deleteModal) closeDeleteModal();
      });
    }

    if (deleteModalConfirm) deleteModalConfirm.addEventListener('click', confirmDelete);

    if (topbarSearch) {
      topbarSearch.addEventListener('input', function () {
        loadAndRender(topbarSearch.value);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (courseModal && courseModal.classList.contains('open')) closeCourseModal();
        if (deleteModal && deleteModal.classList.contains('open')) closeDeleteModal();
      }
    });
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function showFormError(msg) {
    if (!courseFormError) return;
    courseFormError.textContent = msg;
    courseFormError.classList.add('show');
  }

  function clearFormError() {
    if (!courseFormError) return;
    courseFormError.textContent = '';
    courseFormError.classList.remove('show');
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
