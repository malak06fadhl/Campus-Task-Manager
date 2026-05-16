/* ============================================================
   StudyBalance — AI Chat Route
   backend/routes/ai-chat.js
   ============================================================ */

'use strict';

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const config = require('../config');

/* Verify API key is configured */
if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === 'your_api_key_here') {
  console.warn('WARNING: GEMINI_API_KEY not configured in .env file');
  console.warn('AI Support Assistant will not work without a valid API key');
  console.warn('Get your API key from: https://makersuite.google.com/app/apikey');
} else {
  console.log('Gemini API key loaded successfully');
}

/* System prompt for AI Assistant */
const SYSTEM_PROMPT = `You are a friendly and supportive academic assistant for students. Your role is to have natural, helpful conversations while providing academic support when needed.

**Conversation Style:**
- Be warm, conversational, and natural in your responses
- Respond appropriately to greetings, simple questions, and casual messages
- Don't force a structured format for every message
- Match your response style to what the student needs

**When to Use Structured Planning:**
Only provide structured academic planning help when the student:
- Mentions feeling overwhelmed, stressed, or confused about their workload
- Lists multiple assignments, tasks, or deadlines
- Asks for help organizing, prioritizing, or planning their work
- Expresses uncertainty about where to start or what to do first

**Structured Planning Format (use ONLY when appropriate):**

**Priority Order:**
[List priorities numbered 1, 2, 3... based on urgency and importance]

**Start With:**
[Describe the single most important first action to take right now]

**Today's Mini Plan:**
[Provide 2-3 specific, actionable steps the student can complete today]

**Support Note:**
[Write a brief, encouraging message to help the student feel supported]

**Examples of Natural Responses:**
- "hi" → "Hi! How can I help you today?"
- "thanks" → "You're welcome! Let me know if you need anything else."
- "what's 2+2?" → "That's 4! Need help with anything else?"
- "I'm stressed about my assignments" → [Use structured planning format]
- "I have 3 papers due this week" → [Use structured planning format]

Remember previous conversation context and be supportive throughout.`;

/* Initialize Google Generative AI SDK */
const { GoogleGenAI } = require('@google/genai');
const genAI = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

/**
 * Call Gemini API using official SDK
 * @param {Array} messages - Array of {role, content} message objects
 * @returns {Promise<string>} - AI-generated response text
 */
async function callGeminiAPI(messages) {
  try {
    console.log('→ Using Gemini SDK with model: gemini-2.5-flash');
    
    /* Build the full prompt with system instructions and conversation history */
    let fullPrompt = SYSTEM_PROMPT + '\n\n';
    fullPrompt += 'Conversation History:\n';
    
    for (const msg of messages) {
      fullPrompt += `${msg.role === 'user' ? 'Student' : 'Assistant'}: ${msg.content}\n\n`;
    }
    
    fullPrompt += 'Please respond naturally and conversationally. Only use the structured format when the student needs help organizing their academic workload.';

    console.log('→ Sending request to Gemini...');
    
    /* Generate content using the SDK */
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt
    });
    
    console.log('→ Gemini response received successfully');
    
    if (!response || !response.text) {
      console.error('✗ Invalid response structure:', JSON.stringify(response, null, 2));
      throw new Error('Invalid API response structure');
    }

    const responseText = response.text;
    console.log('→ Response text extracted, length:', responseText.length);
    
    return responseText;

  } catch (error) {
    console.error('✗ GEMINI API ERROR');
    console.error('  Error type:', error.name);
    console.error('  Error message:', error.message);
    if (error.stack) {
      console.error('  Error stack:', error.stack);
    }
    
    throw new Error('AI service unavailable');
  }
}

/* ── POST /api/ai-chat ── */
router.post('/ai-chat', requireAuth, async (req, res) => {
  console.log('=== RECEIVED REQUEST FROM FRONTEND ===');
  console.log('User ID:', req.user.userId);
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const { conversationId, messages } = req.body;
    console.log('Conversation ID:', conversationId);
    console.log('Message count:', messages?.length);

    /* Validation */
    if (!conversationId) {
      console.log('Validation failed: missing conversationId');
      return res.status(400).json({
        error: 'Invalid request: conversationId is required'
      });
    }

    if (!messages || !Array.isArray(messages)) {
      console.log('Validation failed: invalid messages array');
      return res.status(400).json({
        error: 'Invalid request: messages array is required'
      });
    }

    if (messages.length === 0) {
      console.log('Validation failed: empty messages array');
      return res.status(400).json({
        error: 'Invalid request: messages array cannot be empty'
      });
    }

    /* Validate message format */
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        console.log('Validation failed: invalid message format');
        return res.status(400).json({
          error: 'Invalid request: each message must have role and content'
        });
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        console.log('Validation failed: invalid message role');
        return res.status(400).json({
          error: 'Invalid request: message role must be "user" or "assistant"'
        });
      }
    }

    console.log('Validation passed');
    console.log('=== SENDING REQUEST TO GEMINI ===');
    
    /* Call Gemini API */
    const reply = await callGeminiAPI(messages);
    
    console.log('=== GEMINI RESPONSE RECEIVED SUCCESSFULLY ===');
    console.log('Response length:', reply.length);
    console.log('Response preview:', reply.substring(0, 100) + '...');
    console.log('=== RETURNING GEMINI REPLY TO FRONTEND ===');

    res.json({ reply });

  } catch (error) {
    console.error('=== BACKEND ERROR ===');
    console.error('Error:', error.message);
    console.error('=====================');

    if (error.message === 'Request timed out') {
      return res.status(500).json({
        error: 'Request timed out. Please try again.'
      });
    }

    res.status(500).json({
      error: 'AI service unavailable. Please try again.'
    });
  }
});

module.exports = router;
