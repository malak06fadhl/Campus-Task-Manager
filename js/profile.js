/* ============================================================
   StudyBalance — Profile Page
   js/profile.js
   Depends on: js/main.js (SB global)
   ============================================================ */

(function () {
  'use strict';

  /* ── State ────────────────────────────────────────────── */
  var currentUser = null;

  /* ── DOM refs ─────────────────────────────────────────── */
  var profileAvatar  = document.getElementById('profileAvatar');
  var profileName    = document.getElementById('profileName');
  var profileRole    = document.getElementById('profileRole');
  var profileSince   = document.getElementById('profileSince');
  var profileStats   = document.getElementById('profileStats');

  var profileForm    = document.getElementById('profileForm');
  var fieldName      = document.getElementById('fieldName');
  var fieldEmail     = document.getElementById('fieldEmail');
  var fieldPassword  = document.getElementById('fieldPassword');
  var fieldConfirm   = document.getElementById('fieldConfirm');

  var successBox     = document.getElementById('profileSuccess');
  var successMsg     = document.getElementById('profileSuccessMsg');
  var errorBox       = document.getElementById('profileError');
  var errorMsg       = document.getElementById('profileErrorMsg');

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    if (!SB.guardStudent()) return;
    currentUser = SB.getCurrentUser();

    populateCard();
    populateForm();
    renderStats();
    bindEvents();
  });

  /* ============================================================
     POPULATE AVATAR CARD
     ============================================================ */
  function populateCard() {
    var initial = currentUser.name
      ? currentUser.name.charAt(0).toUpperCase()
      : '?';

    if (profileAvatar) profileAvatar.textContent = initial;
    if (profileName)   profileName.textContent   = currentUser.name  || '—';
    if (profileRole)   profileRole.textContent   = capFirst(currentUser.role || 'student');

    if (profileSince) {
      if (currentUser.joinedAt) {
        profileSince.textContent = 'Member since ' + SB.formatDate(currentUser.joinedAt);
      } else {
        profileSince.textContent = '';
      }
    }
  }

  /* ============================================================
     POPULATE FORM
     ============================================================ */
  function populateForm() {
    if (fieldName)  fieldName.value  = currentUser.name  || '';
    if (fieldEmail) fieldEmail.value = currentUser.email || '';
    if (fieldPassword) fieldPassword.value = '';
    if (fieldConfirm)  fieldConfirm.value  = '';
  }

  /* ============================================================
     STATS CARD
     ============================================================ */
  function renderStats() {
    if (!profileStats) return;

    var allTasks   = SB.getData('sb_tasks')   || [];
    var allCourses = SB.getData('sb_courses') || [];

    var tasks   = allTasks.filter(function (t) { return t.userId === currentUser.id; });
    var courses = allCourses.filter(function (c) { return c.userId === currentUser.id; });

    var total     = tasks.length;
    var completed = tasks.filter(function (t) { return t.status === 'completed'; }).length;
    var pending   = tasks.filter(function (t) { return t.status === 'pending'; }).length;
    var rate      = total > 0 ? Math.round((completed / total) * 100) : 0;

    profileStats.innerHTML =
      statRow('📚', 'Courses',         courses.length) +
      statRow('📋', 'Total Tasks',     total) +
      statRow('✅', 'Completed',       completed) +
      statRow('⏳', 'Pending',         pending) +
      statRow('📈', 'Completion Rate', rate + '%');
  }

  function statRow(icon, label, value) {
    return '<div class="profile-stat-row">' +
      '<span class="profile-stat-icon">' + icon + '</span>' +
      '<span class="profile-stat-label">' + escHtml(label) + '</span>' +
      '<span class="profile-stat-value">' + escHtml(String(value)) + '</span>' +
    '</div>';
  }

  /* ============================================================
     SAVE PROFILE
     ============================================================ */
  function saveProfile(e) {
    e.preventDefault();
    hideMessages();

    var name     = fieldName.value.trim();
    var email    = fieldEmail.value.trim().toLowerCase();
    var password = fieldPassword.value;
    var confirm  = fieldConfirm.value;

    /* ── Validation ── */
    if (!name) {
      showError('Full name is required.');
      fieldName.focus();
      return;
    }

    if (!email) {
      showError('Email address is required.');
      fieldEmail.focus();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Please enter a valid email address.');
      fieldEmail.focus();
      return;
    }

    /* Duplicate email check — allow same email as current user */
    var allUsers = SB.getData('sb_users') || [];
    var duplicate = allUsers.some(function (u) {
      return u.email.toLowerCase() === email && u.id !== currentUser.id;
    });
    if (duplicate) {
      showError('That email address is already used by another account.');
      fieldEmail.focus();
      return;
    }

    /* Password validation — only if a new password was entered */
    if (password) {
      if (password.length < 6) {
        showError('New password must be at least 6 characters.');
        fieldPassword.focus();
        return;
      }
      if (password !== confirm) {
        showError('Passwords do not match. Please try again.');
        fieldConfirm.focus();
        return;
      }
    }

    /* ── Update sb_users ── */
    var updatedUsers = allUsers.map(function (u) {
      if (u.id !== currentUser.id) return u;
      var updated = {
        id:       u.id,
        name:     name,
        email:    email,
        password: password ? password : u.password,
        role:     u.role,
        banned:   u.banned,
        joinedAt: u.joinedAt || null
      };
      return updated;
    });
    SB.setData('sb_users', updatedUsers);

    /* ── Update sb_currentUser ── */
    var updatedCurrent = {
      id:       currentUser.id,
      name:     name,
      email:    email,
      role:     currentUser.role,
      banned:   currentUser.banned,
      joinedAt: currentUser.joinedAt || null
    };
    SB.setData('sb_currentUser', updatedCurrent);
    currentUser = updatedCurrent;

    /* ── Refresh UI ── */
    populateCard();
    populateForm();
    renderStats();

    /* Re-render user chip in topbar */
    SB.renderUserChip();

    /* Clear password fields */
    if (fieldPassword) fieldPassword.value = '';
    if (fieldConfirm)  fieldConfirm.value  = '';

    showSuccess('Profile updated successfully.');
  }

  /* ============================================================
     RESET FORM
     ============================================================ */
  function resetForm() {
    hideMessages();
    populateForm();
  }

  /* ============================================================
     LOGOUT
     ============================================================ */
  function logout() {
    SB.logout();
  }

  /* ============================================================
     EVENT BINDING
     ============================================================ */
  function bindEvents() {
    if (profileForm) profileForm.addEventListener('submit', saveProfile);

    var resetBtn  = document.getElementById('resetFormBtn');
    var logoutBtn = document.getElementById('logoutBtn');

    if (resetBtn)  resetBtn.addEventListener('click', resetForm);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    /* Hide success/error on any input change */
    [fieldName, fieldEmail, fieldPassword, fieldConfirm].forEach(function (el) {
      if (el) el.addEventListener('input', hideMessages);
    });
  }

  /* ============================================================
     MESSAGE HELPERS
     ============================================================ */
  function showSuccess(msg) {
    if (successBox) successBox.style.display = 'flex';
    if (successMsg) successMsg.textContent   = msg;
    if (errorBox)   errorBox.style.display   = 'none';
    successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showError(msg) {
    if (errorBox)   errorBox.style.display   = 'flex';
    if (errorMsg)   errorMsg.textContent     = msg;
    if (successBox) successBox.style.display = 'none';
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideMessages() {
    if (successBox) successBox.style.display = 'none';
    if (errorBox)   errorBox.style.display   = 'none';
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function capFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
