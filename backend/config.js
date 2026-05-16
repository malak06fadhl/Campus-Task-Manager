/* ============================================================
   StudyBalance — Shared Config
   backend/config.js
   ============================================================ */

'use strict';

/* Load environment variables from .env file */
require('dotenv').config();

module.exports = {
  /* JWT secret — override with JWT_SECRET env var in production */
  JWT_SECRET: process.env.JWT_SECRET || 'studybalance-dev-secret-change-in-production',

  /* bcrypt cost factor */
  SALT_ROUNDS: 10,

  /* Server port */
  PORT: process.env.PORT || 3000,

  /* Gemini API key for AI Support Assistant */
  GEMINI_API_KEY: process.env.GEMINI_API_KEY
};
