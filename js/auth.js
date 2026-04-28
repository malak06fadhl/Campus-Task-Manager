/* ============================================================
   StudyBalance — Authentication Logic
   js/auth.js

   Login, register, and admin login now call the backend API.
   localStorage is used only for sb_token and sb_currentUser.
   Depends on: js/main.js (SB global)
   ============================================================ */

(function () {
  'use strict';

  /* ── API base URL ─────────────────────────────────────── */
  var API = 'http://localhost:3000/api';

  /* ── Utility: show / clear inline error ──────────────── */
  function showError(elementId, message) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearError(elementId) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = '';
    el.classList.remove('show');
  }

  /* ── Utility: toggle submit button loading state ─────── */
  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled      = loading;
    btn.style.opacity = loading ? '0.7' : '';
  }

  /* ── Persist session after a successful API response ──── */
  function saveSession(token, apiUser) {
    SB.setData('sb_token', token);
    /* Normalise API shape → shape expected by all page scripts */
    SB.setData('sb_currentUser', {
      id:        apiUser.id,
      name:      apiUser.full_name,   // API returns full_name; pages expect name
      email:     apiUser.email,
      role:      apiUser.role,
      banned:    apiUser.banned === 1 || apiUser.banned === true,
      joinedAt:  apiUser.created_at || null
    });
  }

  /* ── Redirect based on role ───────────────────────────── */
  function redirectAfterLogin(role) {
    if (role === 'admin') {
      window.location.replace('../html/admin-dashboard.html');
    } else {
      window.location.replace('../html/dashboard.html');
    }
  }

  /* ── Redirect already-logged-in users away from auth ─── */
  function redirectIfLoggedIn() {
    var user = SB.getCurrentUser();
    if (!user) return;
    redirectAfterLogin(user.role);
  }

  /* ============================================================
     STUDENT LOGIN
     ============================================================ */
  var loginForm = document.getElementById('loginForm');

  if (loginForm) {
    redirectIfLoggedIn();

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearError('loginError');

      var email    = document.getElementById('loginEmail').value.trim().toLowerCase();
      var password = document.getElementById('loginPassword').value;
      var btn      = document.getElementById('loginBtn');

      /* ── Client-side validation (fast feedback before network call) ── */
      if (!email) {
        showError('loginError', 'Please enter your email address.');
        return;
      }
      if (!password) {
        showError('loginError', 'Please enter your password.');
        return;
      }

      setLoading(btn, true);

      /* ── Call backend ── */
      fetch(API + '/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, password: password })
      })
      .then(function (res) {
        return res.json().then(function (data) {
          return { status: res.status, data: data };
        });
      })
      .then(function (result) {
        if (result.status !== 200) {
          showError('loginError', result.data.error || 'Login failed. Please try again.');
          setLoading(btn, false);
          return;
        }
        saveSession(result.data.token, result.data.user);
        redirectAfterLogin(result.data.user.role);
      })
      .catch(function () {
        showError('loginError', 'Cannot reach the server. Make sure the backend is running on port 3000.');
        setLoading(btn, false);
      });
    });
  }

  /* ============================================================
     STUDENT REGISTER
     ============================================================ */
  var registerForm = document.getElementById('registerForm');

  if (registerForm) {
    redirectIfLoggedIn();

    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearError('registerError');

      var name     = document.getElementById('registerName').value.trim();
      var email    = document.getElementById('registerEmail').value.trim().toLowerCase();
      var password = document.getElementById('registerPassword').value;
      var confirm  = document.getElementById('registerConfirm').value;
      var btn      = document.getElementById('registerBtn');

      /* ── Client-side validation ── */
      if (!name) {
        showError('registerError', 'Please enter your full name.');
        return;
      }
      if (!email) {
        showError('registerError', 'Please enter your email address.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('registerError', 'Please enter a valid email address.');
        return;
      }
      if (!password) {
        showError('registerError', 'Please enter a password.');
        return;
      }
      if (password.length < 6) {
        showError('registerError', 'Password must be at least 6 characters.');
        return;
      }
      if (password !== confirm) {
        showError('registerError', 'Passwords do not match. Please try again.');
        return;
      }

      setLoading(btn, true);

      /* ── Call backend ── */
      fetch(API + '/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ full_name: name, email: email, password: password })
      })
      .then(function (res) {
        return res.json().then(function (data) {
          return { status: res.status, data: data };
        });
      })
      .then(function (result) {
        if (result.status !== 201) {
          showError('registerError', result.data.error || 'Registration failed. Please try again.');
          setLoading(btn, false);
          return;
        }
        /* Auto-login: backend returns token + user on register */
        saveSession(result.data.token, result.data.user);
        window.location.replace('../html/dashboard.html');
      })
      .catch(function () {
        showError('registerError', 'Cannot reach the server. Make sure the backend is running on port 3000.');
        setLoading(btn, false);
      });
    });
  }

  /* ============================================================
     ADMIN LOGIN
     Admin credentials are now validated by the backend too.
     The /api/login endpoint returns role:'admin' for the admin
     account, so we reuse the same login endpoint.
     ============================================================ */
  var adminLoginForm = document.getElementById('adminLoginForm');

  if (adminLoginForm) {
    var currentUser = SB.getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
      window.location.replace('../html/admin-dashboard.html');
    }

    adminLoginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearError('adminError');

      var email    = document.getElementById('adminEmail').value.trim().toLowerCase();
      var password = document.getElementById('adminPassword').value;
      var btn      = document.getElementById('adminLoginBtn');

      if (!email) {
        showError('adminError', 'Please enter the admin email address.');
        return;
      }
      if (!password) {
        showError('adminError', 'Please enter the admin password.');
        return;
      }

      setLoading(btn, true);

      fetch(API + '/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, password: password })
      })
      .then(function (res) {
        return res.json().then(function (data) {
          return { status: res.status, data: data };
        });
      })
      .then(function (result) {
        if (result.status !== 200) {
          showError('adminError', result.data.error || 'Invalid credentials. Please try again.');
          setLoading(btn, false);
          return;
        }
        if (result.data.user.role !== 'admin') {
          showError('adminError', 'This account does not have admin access.');
          setLoading(btn, false);
          return;
        }
        saveSession(result.data.token, result.data.user);
        window.location.replace('../html/admin-dashboard.html');
      })
      .catch(function () {
        showError('adminError', 'Cannot reach the server. Make sure the backend is running on port 3000.');
        setLoading(btn, false);
      });
    });
  }

})();
