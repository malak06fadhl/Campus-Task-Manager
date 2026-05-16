/* ============================================================
   StudyBalance — Shared Config
   backend/config.js
   
   Configuration that adapts to development vs production
   ============================================================ */

'use strict';

/* Load environment variables from .env file */
require('dotenv').config();

module.exports = {
  /* JWT secret — MUST be set via JWT_SECRET env var in production */
  JWT_SECRET: process.env.JWT_SECRET || 'studybalance-dev-secret-change-in-production',

  /* bcrypt cost factor */
  SALT_ROUNDS: 10,

  /* Server port */
  PORT: process.env.PORT || 3000,

  /* Gemini API key for AI Support Assistant */
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,

  /* Database URL for PostgreSQL (production) */
  DATABASE_URL: process.env.DATABASE_URL,

  /* Node environment */
  NODE_ENV: process.env.NODE_ENV || 'development',

  /* CORS origin - allow all in development, specific origin in production */
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  /* Frontend URL for CORS */
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5500'
};
