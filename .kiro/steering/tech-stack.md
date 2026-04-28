---
inclusion: auto
---

# Tech Stack

This project is a lightweight front-end web application for local development.

## Frontend

- HTML
- CSS
- JavaScript

## Storage

- Browser localStorage for demo data and simple persistence.

## Development Style

- Keep the project simple and easy to run locally.
- Do not use React, Angular, Vue, Tailwind, Node backend, Express, or database unless the user explicitly asks.
- Use separate files for each responsibility:
  - `index.html` for landing page
  - `dashboard.html` for student dashboard
  - `courses.html` for course management
  - `tasks.html` or `task-management.html` for task management
  - `scenario.html` for what-if simulation
  - `heatmap.html` for workload calendar
  - `admin-login.html` for admin login
  - `admin-dashboard.html` for admin dashboard
  - `style.css` for all shared styling
  - `main.js` for shared helpers
  - page-specific JavaScript files for page logic

## UI Guidelines

- Use a modern student productivity dashboard style.
- Light background.
- White cards.
- Subtle borders and shadows.
- Responsive layout for laptop, tablet, and mobile.
- Use CSS Grid and Flexbox.
- Avoid horizontal scrolling on small screens.

## Data Guidelines

- Store demo users, courses, and tasks in localStorage.
- Keep data structures simple and readable.
- Use clear names for functions and variables.