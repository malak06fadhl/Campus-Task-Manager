# AI Support Assistant - Setup Guide

## Overview

The AI Support Assistant is now fully implemented and integrated into StudyBalance. This feature provides students with conversational AI support for organizing their academic workload through natural language interaction.

## Features Implemented

✅ **Backend Integration**
- Gemini API integration with proper error handling
- Secure POST /api/ai-chat endpoint with JWT authentication
- 30-second timeout for AI requests
- Context window management (last 10 messages)
- Structured system prompt for consistent AI responses

✅ **Frontend UI**
- Floating AI button on dashboard (bottom-right corner)
- Dedicated AI assistant page with two-panel layout
- Conversation list panel with auto-generated titles
- Chat panel with message display and input area
- Responsive design (mobile, tablet, desktop)

✅ **Conversation Management**
- localStorage persistence for conversations
- Auto-generated conversation titles from first message
- 50-conversation limit with automatic cleanup
- Load and continue previous conversations
- Context-aware AI responses

✅ **User Experience**
- Real-time message sending and receiving
- Loading indicator during AI processing
- Error handling with retry functionality
- Character counter (2000 character limit)
- Auto-expanding textarea
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)

## Setup Instructions

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Environment Variables

Open `backend/.env` and replace `your_api_key_here` with your actual Gemini API key:

```env
GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

### 3. Start the Backend Server

```bash
cd backend
npm start
```

The server should start on `http://localhost:3000`

### 4. Open the Application

1. Open `html/index.html` in your browser (or use a local server)
2. Log in as a student
3. You'll see the floating AI button (🤖) in the bottom-right corner of the dashboard
4. Click it to access the AI Support Assistant

## Usage

### Starting a Conversation

1. Click the floating AI button on the dashboard
2. Click "+ New Chat" to start a new conversation
3. Type your message in the input area
4. Press Enter or click "Send"

### Example Prompts

- "I have 3 assignments due this week and I'm feeling overwhelmed"
- "Help me prioritize my tasks for today"
- "I don't know where to start with my project"

### AI Response Format

The AI assistant provides structured responses with:
- **Priority Order**: Numbered list of priorities
- **Start With**: The most important first action
- **Today's Mini Plan**: 2-3 actionable steps
- **Support Note**: Encouraging message

### Managing Conversations

- **View Previous Conversations**: Click any conversation in the left panel
- **Continue Conversation**: Click a conversation to load it and continue chatting
- **Context Memory**: The AI remembers the last 10 messages in each conversation
- **Auto-Save**: All conversations are automatically saved to localStorage

## Technical Details

### File Structure

```
studybalance/
├── backend/
│   ├── routes/
│   │   └── ai-chat.js          # New AI chat endpoint
│   ├── .env                     # Environment variables (API key)
│   ├── config.js                # Updated with GEMINI_API_KEY
│   └── server.js                # Updated with AI route registration
├── html/
│   ├── ai-assistant.html        # New AI assistant page
│   └── dashboard.html           # Updated with floating button
├── css/
│   └── style.css                # Updated with AI styles
└── js/
    └── ai-assistant.js          # New AI assistant logic
```

### API Endpoint

**POST /api/ai-chat**

Request:
```json
{
  "conversationId": "uuid-v4",
  "messages": [
    { "role": "user", "content": "message text" },
    { "role": "assistant", "content": "response text" }
  ]
}
```

Response:
```json
{
  "reply": "AI-generated response with structured format"
}
```

### localStorage Structure

Conversations are stored in localStorage with key `ai_conversations`:

```json
[
  {
    "id": "uuid-v4",
    "title": "Help with 3 assignments due...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z",
    "messages": [
      {
        "role": "user",
        "content": "message text",
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
]
```

## Security Features

✅ JWT authentication required for all AI requests
✅ API key stored securely in .env (never exposed to frontend)
✅ Input validation and sanitization
✅ HTML escaping to prevent XSS attacks
✅ 30-second timeout to prevent hanging requests
✅ User-scoped conversations (localStorage per browser session)

## Error Handling

The system handles various error scenarios:

- **Network Errors**: "Network error. Please check your connection and try again."
- **API Errors**: "Unable to reach AI service. Please try again."
- **Timeout**: "The AI is taking longer than expected. Please try again."
- **Authentication**: "Session expired. Please log in again." (redirects to login)
- **Validation**: "Message is too long (max 2000 characters)"
- **Storage**: "Storage limit reached. Please delete old conversations."

All errors include a retry button for easy recovery.

## Limitations

- **Storage**: 50 conversations maximum per user (oldest automatically removed)
- **Message Length**: 2000 characters per message
- **Context Window**: Last 10 messages sent to AI for context
- **Timeout**: 30 seconds for AI responses
- **Browser Storage**: Conversations stored in localStorage (not synced across devices)

## Future Enhancements

The implementation is structured to support future enhancements:

- **Database Migration**: localStorage structure matches planned database schema
- **Multi-Device Sync**: Data structure supports server-side storage
- **Conversation Search**: Search through conversation history
- **Export/Share**: Export conversations or share with others
- **Advanced Features**: Conversation folders, tags, favorites

## Troubleshooting

### "AI service unavailable" Error

1. Check that your Gemini API key is correctly set in `backend/.env`
2. Verify the backend server is running
3. Check the browser console for detailed error messages
4. Ensure you have an active internet connection

### Floating Button Not Appearing

1. Make sure you're logged in as a student
2. Check that you're on the dashboard page
3. Clear browser cache and reload

### Conversations Not Saving

1. Check browser localStorage is enabled
2. Verify you haven't exceeded the 50-conversation limit
3. Check browser console for storage errors

### Backend Server Won't Start

1. Ensure all dependencies are installed: `npm install`
2. Check that port 3000 is not already in use
3. Verify Node.js version is >= 18.0.0

## Testing Checklist

✅ Backend endpoint responds to authenticated requests
✅ Floating button appears on dashboard
✅ AI assistant page loads correctly
✅ New conversation can be created
✅ Messages can be sent and AI responds
✅ Conversations are saved to localStorage
✅ Previous conversations can be loaded
✅ Context is maintained across messages
✅ Error handling works for all scenarios
✅ Responsive design works on mobile
✅ Character counter updates correctly
✅ Loading indicator appears during AI processing

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify all setup steps were completed
3. Review the troubleshooting section above
4. Check that your Gemini API key is valid and has quota remaining

---

**Implementation Complete!** 🎉

The AI Support Assistant is now fully functional and ready to help students organize their academic workload.
