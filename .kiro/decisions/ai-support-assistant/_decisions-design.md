# AI Support Assistant — Design Decisions

## Overview

This document outlines the technical design decisions for the AI Support Assistant feature, including architecture, component design, data models, API integration, and testing strategy.

---

## Architecture Decisions

### System Architecture
- **Pattern**: Client-Server with External AI Service
- **Frontend**: Static HTML/CSS/JS (follows existing StudyBalance pattern)
- **Backend**: Express.js REST API (extends existing server)
- **AI Provider**: Gemini API (Google's generative AI)
- **Storage**: localStorage (client-side, structured for future DB migration)

### Component Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                    │
│  ┌──────────────┐  ┌─────────────────────────────────┐ │
│  │  Dashboard   │  │    AI Assistant Page            │ │
│  │  (floating   │  │  ┌──────────┐  ┌──────────────┐ │ │
│  │   button)    │  │  │Conversation│ │  Chat Area   │ │ │
│  │              │  │  │   List     │ │  (messages)  │ │ │
│  └──────────────┘  │  └──────────┘  └──────────────┘ │ │
│                     │  ┌──────────────────────────────┐ │
│                     │  │  Message Input + Send Button │ │
│                     │  └──────────────────────────────┘ │
│                     └─────────────────────────────────┘ │
│                              │                           │
│                     localStorage (conversations)         │
└──────────────────────────────┼──────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (Express.js Server)                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  POST /api/ai-chat                                 │ │
│  │  - JWT Authentication Middleware                   │ │
│  │  - Request Validation                              │ │
│  │  - Context Window Management (last 10 messages)    │ │
│  │  - System Prompt Injection                         │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────┐
│              Gemini API (External Service)               │
│  - Receives system prompt + conversation context        │
│  - Generates structured response                        │
│  - Returns AI-generated text                            │
└─────────────────────────────────────────────────────────┘
```

### Why This Architecture?
1. **Separation of Concerns**: Frontend handles UI/UX, backend handles security and API orchestration
2. **Security**: API keys never exposed to client
3. **Scalability**: Easy to migrate from localStorage to database later
4. **Consistency**: Follows existing StudyBalance patterns

---

## Component Design Decisions

### 1. Floating AI Button (dashboard.html)
**Location**: Bottom-right corner, fixed position  
**Design**:
- Circular button (56px diameter minimum for touch targets)
- Background: `var(--blue)` (#2f6fe4)
- Icon: "🤖" emoji or "AI" text
- Box shadow: `var(--shadow-md)` for elevation
- Hover effect: slight scale + brightness change
- z-index: 100 (above content, below modals)

**Positioning**:
```css
.ai-floating-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--blue);
  color: white;
  box-shadow: var(--shadow-md);
  z-index: 100;
}
```

### 2. AI Assistant Page Layout (ai-assistant.html)
**Structure**:
- Standard page shell (sidebar + topbar + main content)
- Main content: Two-panel layout
  - Left panel: 280px fixed width (conversation list)
  - Right panel: Flexible width (active chat)

**Responsive Behavior**:
- Desktop (>768px): Side-by-side panels
- Mobile (<768px): Stack panels, conversation list collapsible

### 3. Conversation List Panel
**Components**:
- Header: "New Chat" button (primary blue button)
- List: Scrollable conversation items
- Empty state: Icon + message when no conversations

**Conversation Item Design**:
```
┌─────────────────────────────────────┐
│ 📝 Conversation Title (truncated)   │
│ 2 hours ago                         │
└─────────────────────────────────────┘
```
- Background: `var(--card)` (white)
- Active state: `var(--blue-soft)` background
- Hover: subtle background change
- Border-bottom: `var(--line)` separator

### 4. Chat Area Panel
**Components**:
- Message list (scrollable, auto-scroll to bottom)
- Loading indicator (animated dots)
- Empty state (welcome message + example prompts)

**Message Bubble Design**:

**User Message** (right-aligned):
```
                    ┌──────────────────────┐
                    │ User message text    │
                    │ 10:30 AM             │
                    └──────────────────────┘
```
- Background: `var(--blue)` (#2f6fe4)
- Color: white
- Border-radius: 16px (top-left, top-right, bottom-left), 4px (bottom-right)
- Max-width: 70%
- Margin-left: auto

**AI Message** (left-aligned):
```
┌──────────────────────────────────────┐
│ **Priority Order:**                  │
│ 1. Assignment A                      │
│ 2. Study for exam                    │
│                                      │
│ **Start With:**                      │
│ Begin with Assignment A...           │
│                                      │
│ **Today's Mini Plan:**               │
│ - Step 1                             │
│ - Step 2                             │
│                                      │
│ **Support Note:**                    │
│ You've got this! 💪                  │
│                                      │
│ 10:31 AM                             │
└──────────────────────────────────────┘
```
- Background: `var(--card)` (white)
- Border: 1px solid `var(--line)`
- Border-radius: 16px (top-left, top-right, bottom-right), 4px (bottom-left)
- Max-width: 80%
- Markdown rendering for bold section headers

### 5. Message Input Area
**Design**:
```
┌─────────────────────────────────────────────────────┐
│ [Textarea: "Tell me about your workload..."]  [Send]│
└─────────────────────────────────────────────────────┘
```
- Textarea: Auto-expanding (min 1 row, max 5 rows)
- Send button: Blue primary button, disabled when empty or loading
- Border-top: 1px solid `var(--line)`
- Padding: 16px
- Enter key: Send message (Shift+Enter: new line)

---

## Data Models

### Conversation Model (localStorage)
```typescript
interface Conversation {
  id: string;              // UUID v4
  title: string;           // Auto-generated from first message (max 50 chars)
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp
  messages: Message[];     // Array of messages
}
```

### Message Model
```typescript
interface Message {
  role: 'user' | 'assistant';  // Message sender
  content: string;              // Message text
  timestamp: string;            // ISO 8601 timestamp
}
```

### localStorage Structure
```javascript
{
  "ai_conversations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Help with 3 assignments due this week",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z",
      "messages": [
        {
          "role": "user",
          "content": "I have 3 assignments due this week and I'm feeling overwhelmed",
          "timestamp": "2024-01-15T10:30:00.000Z"
        },
        {
          "role": "assistant",
          "content": "**Priority Order:**\n1. Assignment A...",
          "timestamp": "2024-01-15T10:31:00.000Z"
        }
      ]
    }
  ]
}
```

### Future Database Schema (for migration)
```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE ai_messages (
  id SERIAL PRIMARY KEY,
  conversation_id UUID REFERENCES ai_conversations(id),
  role VARCHAR(10) CHECK (role IN ('user', 'assistant')),
  content TEXT,
  timestamp TIMESTAMP
);
```

---

## API Design

### Backend Endpoint: POST /api/ai-chat

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    {
      "role": "user",
      "content": "I have 3 assignments due this week"
    }
  ]
}
```

**Response (Success - 200)**:
```json
{
  "reply": "**Priority Order:**\n1. Assignment A (due in 2 days)\n2. Assignment B (due in 4 days)\n3. Assignment C (due in 6 days)\n\n**Start With:**\nBegin with Assignment A since it's due soonest...\n\n**Today's Mini Plan:**\n- Spend 1 hour outlining Assignment A\n- Review requirements for Assignment B\n- Take a 10-minute break between tasks\n\n**Support Note:**\nYou've got this! Breaking it down into smaller steps makes it manageable. 💪"
}
```

**Response (Error - 401)**:
```json
{
  "error": "Unauthorized"
}
```

**Response (Error - 500)**:
```json
{
  "error": "AI service unavailable. Please try again."
}
```

### Gemini API Integration

**System Prompt**:
```
You are an academic workload organizer for students. Your role is to help students organize their thoughts about academic tasks, prioritize their workload based on urgency and importance, suggest actionable first steps, and provide calming, supportive guidance.

Always respond in this structure:

**Priority Order:**
[List priorities numbered 1, 2, 3... based on urgency and importance]

**Start With:**
[Describe the single most important first action to take right now]

**Today's Mini Plan:**
[Provide 2-3 specific, actionable steps the student can complete today]

**Support Note:**
[Write a brief, encouraging message to help the student feel supported]

Use previous conversation context to provide continuity and remember what the student has told you.
```

**Context Window**: Last 10 messages (5 user + 5 assistant pairs)

**API Call Structure**:
```javascript
const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': process.env.GEMINI_API_KEY
  },
  body: JSON.stringify({
    contents: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...contextMessages,
      { role: 'user', parts: [{ text: userMessage }] }
    ]
  })
});
```

---

## Error Handling Strategy

### Frontend Error Handling
1. **Network Errors**: Display "Network error. Please check your connection."
2. **API Errors**: Display "Unable to reach AI service. Please try again."
3. **Timeout (30s)**: Display "The AI is taking longer than expected. Please try again."
4. **Empty Message**: Disable send button, show validation hint
5. **localStorage Full**: Display "Storage limit reached. Please delete old conversations."

### Backend Error Handling
1. **Missing JWT**: Return 401 Unauthorized
2. **Invalid JWT**: Return 401 Unauthorized
3. **Missing/Invalid Request Body**: Return 400 Bad Request
4. **Gemini API Failure**: Return 500 with user-friendly message
5. **Gemini API Timeout**: Return 500 with timeout message
6. **Rate Limiting**: Return 429 Too Many Requests

### Error Display Design
```
┌─────────────────────────────────────────┐
│ ⚠️ Unable to reach AI service           │
│ Please try again in a moment.           │
│ [Retry Button]                          │
└─────────────────────────────────────────┘
```
- Background: `var(--red-soft)`
- Border: 1px solid red
- Icon: Warning emoji
- Retry button: Secondary style

---

## Security Decisions

### Authentication
- **Requirement**: Valid JWT token in Authorization header
- **Validation**: Use existing `auth.js` middleware
- **Scope**: Only authenticated students can access AI assistant

### API Key Protection
- **Storage**: Environment variable `GEMINI_API_KEY` in `.env` file
- **Access**: Backend only, never sent to frontend
- **Logging**: Never log API key in application logs
- **Error Messages**: Generic errors, no API key exposure

### Data Privacy
- **Conversation Isolation**: Each user can only access their own conversations
- **No Cross-User Access**: Validate user ID from JWT before serving data
- **localStorage Scope**: Scoped to user session (browser-level isolation)

### Input Validation
- **Message Length**: Max 2000 characters per message
- **Message Array**: Max 10 messages in context window
- **Sanitization**: Escape HTML in user messages before display
- **Rate Limiting**: Consider implementing rate limiting (future enhancement)

---

## Testing Strategy

### Property-Based Testing Assessment
**Decision**: Property-based testing is **NOT applicable** for this feature.

**Reasoning**:
1. **UI Rendering**: The feature is primarily UI-focused (chat interface, conversation list)
2. **External Service Integration**: Core functionality depends on Gemini API (external, non-deterministic)
3. **Side Effects**: Most operations involve side effects (localStorage writes, API calls, DOM updates)
4. **No Pure Functions**: Limited pure transformation logic suitable for PBT

**Alternative Testing Approaches**:
- **Unit Tests**: Test individual functions (title generation, timestamp formatting, message validation)
- **Integration Tests**: Test API endpoint with mocked Gemini responses
- **E2E Tests**: Test complete user flows (start conversation, send message, load conversation)
- **Manual Testing**: UI/UX validation, responsive design, error scenarios

### Unit Testing Strategy

**Test Coverage**:
1. **Conversation Management**:
   - ✅ Generate conversation title from first message (max 50 chars)
   - ✅ Truncate long titles with "..."
   - ✅ Create new conversation with UUID
   - ✅ Sort conversations by updatedAt (newest first)
   - ✅ Limit conversations to 50 (remove oldest)

2. **Message Handling**:
   - ✅ Validate message role (user/assistant)
   - ✅ Validate message content (not empty, max length)
   - ✅ Format timestamp to human-readable ("2 hours ago")
   - ✅ Extract context window (last 10 messages)

3. **localStorage Operations**:
   - ✅ Save conversation to localStorage
   - ✅ Load conversations from localStorage
   - ✅ Handle corrupted localStorage data
   - ✅ Handle localStorage quota exceeded

4. **Input Validation**:
   - ✅ Reject empty messages
   - ✅ Reject messages exceeding max length
   - ✅ Sanitize HTML in user input

**Test Framework**: Jest (if Node.js) or Mocha/Chai

### Integration Testing Strategy

**Backend API Tests**:
1. **Authentication**:
   - ✅ Reject requests without JWT token (401)
   - ✅ Reject requests with invalid JWT token (401)
   - ✅ Accept requests with valid JWT token (200)

2. **Request Validation**:
   - ✅ Reject empty messages array (400)
   - ✅ Reject invalid message format (400)
   - ✅ Accept valid request body (200)

3. **Gemini API Integration** (with mocks):
   - ✅ Send system prompt + context + user message
   - ✅ Parse Gemini response correctly
   - ✅ Handle Gemini API errors gracefully
   - ✅ Handle Gemini API timeout (30s)

4. **Response Format**:
   - ✅ Return structured response with "reply" field
   - ✅ Return error response on failure

**Test Framework**: Supertest + Jest

### End-to-End Testing Strategy

**User Flows**:
1. **Start New Conversation**:
   - Navigate to dashboard
   - Click floating AI button
   - Verify AI assistant page loads
   - Click "New Chat" button
   - Verify empty chat area with welcome message

2. **Send First Message**:
   - Type message in input area
   - Click send button
   - Verify user message appears
   - Verify loading indicator appears
   - Verify AI response appears
   - Verify conversation title generated

3. **Continue Conversation**:
   - Send second message
   - Verify context is maintained (AI references previous message)
   - Verify conversation updated in list

4. **Load Previous Conversation**:
   - Click conversation in list
   - Verify all messages load
   - Send new message
   - Verify context includes previous messages

5. **Error Scenarios**:
   - Disconnect network
   - Send message
   - Verify error message appears
   - Verify retry button works

**Test Framework**: Playwright or Cypress

### Manual Testing Checklist

**UI/UX**:
- [ ] Floating button visible on dashboard
- [ ] Floating button positioned correctly (bottom-right)
- [ ] AI assistant page matches design system
- [ ] Conversation list scrollable
- [ ] Chat area scrollable
- [ ] Auto-scroll to latest message works
- [ ] Message bubbles styled correctly (user vs AI)
- [ ] Timestamps formatted correctly
- [ ] Loading indicator appears during AI response
- [ ] Empty states display correctly

**Responsive Design**:
- [ ] Desktop (1920x1080): Two-panel layout
- [ ] Laptop (1366x768): Two-panel layout
- [ ] Tablet (768x1024): Two-panel layout
- [ ] Mobile (375x667): Stacked layout, conversation list collapsible

**Functionality**:
- [ ] New conversation created successfully
- [ ] Message sent successfully
- [ ] AI response received and displayed
- [ ] Conversation saved to localStorage
- [ ] Conversation loaded from localStorage
- [ ] Context window includes last 10 messages
- [ ] Conversation title auto-generated
- [ ] Conversations sorted by most recent

**Error Handling**:
- [ ] Network error displays correctly
- [ ] API error displays correctly
- [ ] Timeout error displays correctly
- [ ] Empty message validation works
- [ ] localStorage full error displays correctly

**Security**:
- [ ] JWT token required for API access
- [ ] API key not exposed in frontend
- [ ] User can only access own conversations

---

## Performance Considerations

### Frontend Performance
1. **Lazy Loading**: Load conversations on demand (not all at once)
2. **Virtual Scrolling**: For large conversation lists (future enhancement)
3. **Debouncing**: Debounce auto-save to localStorage (500ms)
4. **Message Rendering**: Use DocumentFragment for batch DOM updates

### Backend Performance
1. **Context Window Limit**: Only send last 10 messages (reduce API payload)
2. **Timeout**: 30-second timeout for Gemini API calls
3. **Caching**: Consider caching system prompt (future enhancement)
4. **Rate Limiting**: Implement rate limiting per user (future enhancement)

### localStorage Optimization
1. **Conversation Limit**: Max 50 conversations per user
2. **Compression**: Consider compressing old conversations (future enhancement)
3. **Cleanup**: Remove oldest conversations when limit reached

---

## Accessibility Decisions

### Keyboard Navigation
- Tab order: Floating button → New Chat button → Conversation list → Message input → Send button
- Enter key: Send message (Shift+Enter: new line)
- Escape key: Close conversation list on mobile

### Screen Reader Support
- Floating button: `aria-label="Open AI Study Support"`
- Send button: `aria-label="Send message"`
- Loading indicator: `aria-live="polite"` with "AI is thinking..."
- Error messages: `role="alert"` for immediate announcement

### Visual Accessibility
- Color contrast: WCAG AA compliant (4.5:1 for text)
- Focus indicators: Visible focus outline on all interactive elements
- Touch targets: Minimum 44x44 pixels for mobile

---

## Open Questions for User Review

1. **Conversation Limit**: Confirmed 50 conversations max per user?
2. **Context Window**: Confirmed last 10 messages for context?
3. **Message Length**: Should we limit user message length? (suggested: 2000 chars)
4. **Markdown Support**: Should AI responses support markdown formatting for bold headers?
5. **Conversation Deletion**: Should users be able to manually delete conversations? (not in requirements)
6. **Rate Limiting**: Should we implement rate limiting? (e.g., 10 messages per minute)

---

## Implementation Notes

### File Structure
```
studybalance/
├── html/
│   ├── dashboard.html (add floating button)
│   └── ai-assistant.html (new file)
├── css/
│   └── style.css (add AI assistant styles)
├── js/
│   └── ai-assistant.js (new file)
└── backend/
    ├── routes/
    │   └── ai-chat.js (new file)
    └── .env (add GEMINI_API_KEY)
```

### Dependencies
- **Frontend**: No new dependencies (vanilla JS)
- **Backend**: `@google/generative-ai` (Gemini SDK) or `axios` for API calls

### Environment Variables
```
GEMINI_API_KEY=your_api_key_here
```

---

## Success Criteria

✅ Design document covers all architectural decisions  
✅ Component designs match StudyBalance design system  
✅ Data models support future database migration  
✅ API design is secure and follows REST principles  
✅ Error handling strategy is comprehensive  
✅ Testing strategy is appropriate (no PBT, focus on integration/E2E)  
✅ Security decisions protect API keys and user data  
✅ Performance considerations address scalability  
✅ Accessibility requirements meet WCAG AA standards  

---

## Next Steps

1. **User Review**: Review and approve this design document
2. **Create Tasks**: Break down implementation into tasks (tasks.md)
3. **Implementation**: Follow tasks in priority order
4. **Testing**: Execute testing strategy
5. **Deployment**: Deploy to production

