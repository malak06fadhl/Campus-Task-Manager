# Design Document: AI Support Assistant

## Overview

The AI Support Assistant is a conversational interface integrated into the StudyBalance application that provides students with structured guidance for organizing their academic workload. The feature consists of a floating access button on the dashboard, a dedicated AI assistant page with conversation management, and a secure backend integration with the Gemini API.

### Key Design Principles

1. **Security First**: API keys protected in backend, JWT authentication required
2. **User Experience**: Single-click access, persistent conversations, structured responses
3. **Design Consistency**: Follows StudyBalance design system (colors, typography, spacing)
4. **Future-Ready**: localStorage structure designed for easy database migration
5. **Responsive**: Fully functional on mobile, tablet, and desktop devices

### System Context

The AI Support Assistant extends the existing StudyBalance application by adding:
- A floating button on the dashboard for quick access
- A new page (ai-assistant.html) for conversation management
- A new backend endpoint (POST /api/ai-chat) for secure AI integration
- Client-side conversation persistence using localStorage

---

## Architecture

### System Architecture Pattern

**Pattern**: Client-Server with External AI Service

**Components**:
- **Frontend**: Static HTML/CSS/JavaScript (follows existing StudyBalance pattern)
- **Backend**: Express.js REST API (extends existing server.js)
- **AI Provider**: Gemini API (Google's generative AI service)
- **Storage**: localStorage (client-side, structured for future database migration)

### Architecture Diagram

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

### Architectural Decisions

**Why This Architecture?**

1. **Separation of Concerns**: Frontend handles UI/UX and conversation management, backend handles security and API orchestration
2. **Security**: API keys never exposed to client, all AI requests authenticated
3. **Scalability**: Easy to migrate from localStorage to database without changing frontend code
4. **Consistency**: Follows existing StudyBalance patterns (Express.js backend, vanilla JS frontend)
5. **Maintainability**: Clear boundaries between components enable independent updates

**Trade-offs**:
- **localStorage Limitation**: 5-10MB storage limit per domain (mitigated by 50-conversation limit)
- **No Real-time Sync**: Conversations stored locally, not synced across devices (acceptable for MVP)
- **External Dependency**: Relies on Gemini API availability (mitigated by error handling and timeouts)

---

## Components and Interfaces

### 1. Floating AI Button Component

**Location**: dashboard.html (bottom-right corner, fixed position)

**Purpose**: Provides single-click access to the AI Assistant from the dashboard

**Visual Design**:
- Shape: Circular button
- Size: 56px diameter (minimum touch target size)
- Background: `var(--blue)` (#2f6fe4)
- Icon: "🤖" emoji or "AI" text label
- Shadow: `var(--shadow-md)` for elevation effect
- z-index: 100 (above content, below modals)

**CSS Implementation**:
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
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: transform 0.2s, filter 0.2s;
  z-index: 100;
}

.ai-floating-btn:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
}
```

**Behavior**:
- Click: Navigate to ai-assistant.html
- Hover: Slight scale increase + brightness change
- Visible only to authenticated students

**Validates Requirements**: 1.1-1.8

---

### 2. AI Assistant Page Layout

**File**: ai-assistant.html

**Structure**:
- Standard StudyBalance page shell (sidebar + topbar + main content)
- Main content: Two-panel layout
  - Left panel: Conversation list (280px fixed width)
  - Right panel: Active chat area (flexible width)

**HTML Structure**:
```html
<div class="page-container">
  <aside class="sidebar"><!-- Standard sidebar --></aside>
  
  <div class="main-content">
    <nav class="topbar"><!-- Standard topbar --></nav>
    
    <main class="ai-assistant-container">
      <h1>AI Study Support</h1>
      
      <div class="ai-layout">
        <!-- Left Panel: Conversation List -->
        <aside class="conversation-list-panel">
          <button class="new-chat-btn">+ New Chat</button>
          <div class="conversation-list">
            <!-- Conversation items rendered here -->
          </div>
        </aside>
        
        <!-- Right Panel: Active Chat -->
        <section class="chat-panel">
          <div class="messages-container">
            <!-- Messages rendered here -->
          </div>
          <div class="message-input-area">
            <textarea placeholder="Tell me about your workload..."></textarea>
            <button class="send-btn">Send</button>
          </div>
        </section>
      </div>
    </main>
  </div>
</div>
```

**Responsive Behavior**:
- Desktop (>768px): Side-by-side panels
- Mobile (<768px): Stacked panels, conversation list collapsible with toggle button

**CSS Layout**:
```css
.ai-layout {
  display: flex;
  gap: 24px;
  height: calc(100vh - 200px);
}

.conversation-list-panel {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid var(--line);
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .ai-layout {
    flex-direction: column;
  }
  
  .conversation-list-panel {
    width: 100%;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid var(--line);
  }
}
```

**Validates Requirements**: 2.1-2.11

---

### 3. Conversation List Panel Component

**Purpose**: Displays saved conversations and provides "New Chat" functionality

**Sub-components**:
1. **New Chat Button**: Primary action button at top of panel
2. **Conversation List**: Scrollable list of conversation items
3. **Empty State**: Displayed when no conversations exist

**Conversation Item Design**:

Visual representation:
```
┌─────────────────────────────────────┐
│ 📝 Help with 3 assignments due...   │
│ 2 hours ago                         │
└─────────────────────────────────────┘
```

**HTML Structure**:
```html
<div class="conversation-item" data-conversation-id="uuid">
  <div class="conversation-icon">📝</div>
  <div class="conversation-info">
    <div class="conversation-title">Help with 3 assignments due...</div>
    <div class="conversation-time">2 hours ago</div>
  </div>
</div>
```

**CSS Styling**:
```css
.conversation-item {
  padding: 12px;
  background: var(--card);
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: background 0.2s;
}

.conversation-item:hover {
  background: var(--bg);
}

.conversation-item.active {
  background: var(--blue-soft);
  border-left: 3px solid var(--blue);
}

.conversation-title {
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-time {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}
```

**Empty State**:
```html
<div class="empty-state">
  <div class="empty-icon">💬</div>
  <p>No conversations yet. Start a new chat!</p>
</div>
```

**Behavior**:
- Click conversation item: Load conversation into chat panel
- Active conversation: Highlighted with blue accent
- Scrollable: When conversations exceed visible area
- Sorted: Most recent (by updatedAt) first

**Validates Requirements**: 6.1-6.7

---

### 4. Chat Area Component

**Purpose**: Displays conversation messages and handles user input

**Sub-components**:
1. **Messages Container**: Scrollable area displaying message history
2. **Loading Indicator**: Animated indicator during AI response
3. **Empty State**: Welcome message for new conversations
4. **Message Input Area**: Textarea + send button

**Message Bubble Design**:

**User Message** (right-aligned):
```
                    ┌──────────────────────┐
                    │ I have 3 assignments │
                    │ due this week        │
                    │ 10:30 AM             │
                    └──────────────────────┘
```

**CSS for User Message**:
```css
.message.user {
  margin-left: auto;
  max-width: 70%;
  background: var(--blue);
  color: white;
  border-radius: 16px 16px 4px 16px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.message-timestamp {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}
```

**AI Message** (left-aligned):
```
┌──────────────────────────────────────┐
│ **Priority Order:**                  │
│ 1. Assignment A (due in 2 days)      │
│ 2. Assignment B (due in 4 days)      │
│ 3. Assignment C (due in 6 days)      │
│                                      │
│ **Start With:**                      │
│ Begin with Assignment A since...     │
│                                      │
│ **Today's Mini Plan:**               │
│ - Spend 1 hour outlining A           │
│ - Review requirements for B          │
│ - Take a 10-minute break             │
│                                      │
│ **Support Note:**                    │
│ You've got this! 💪                  │
│                                      │
│ 10:31 AM                             │
└──────────────────────────────────────┘
```

**CSS for AI Message**:
```css
.message.assistant {
  max-width: 80%;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 16px 16px 16px 4px;
  padding: 16px;
  margin-bottom: 12px;
}

.message.assistant strong {
  color: var(--blue);
  display: block;
  margin-top: 12px;
  margin-bottom: 4px;
}

.message.assistant strong:first-child {
  margin-top: 0;
}
```

**Loading Indicator**:
```html
<div class="loading-indicator">
  <div class="loading-dots">
    <span></span>
    <span></span>
    <span></span>
  </div>
  <span class="loading-text">AI is thinking...</span>
</div>
```

**Welcome Message** (empty state):
```html
<div class="welcome-message">
  <div class="welcome-icon">🤖</div>
  <h3>Hi! I'm your AI study support assistant.</h3>
  <p>Tell me about your workload, and I'll help you organize and prioritize.</p>
  <div class="example-prompts">
    <p><strong>Try asking:</strong></p>
    <ul>
      <li>"I have 3 assignments due this week and I'm feeling overwhelmed"</li>
      <li>"Help me prioritize my tasks for today"</li>
      <li>"I don't know where to start with my project"</li>
    </ul>
  </div>
</div>
```

**Validates Requirements**: 4.1-4.12, 11.1-11.9, 18.4-18.7

---

### 5. Message Input Area Component

**Purpose**: Allows students to type and send messages to the AI Assistant

**Visual Design**:
```
┌─────────────────────────────────────────────────────┐
│ [Textarea: "Tell me about your workload..."]  [Send]│
└─────────────────────────────────────────────────────┘
```

**HTML Structure**:
```html
<div class="message-input-area">
  <textarea 
    id="message-input"
    placeholder="Tell me about your workload..."
    rows="1"
    maxlength="2000"
  ></textarea>
  <button id="send-btn" class="send-btn" disabled>
    <span>Send</span>
    <span class="send-icon">➤</span>
  </button>
</div>
```

**CSS Styling**:
```css
.message-input-area {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid var(--line);
  background: var(--card);
}

#message-input {
  flex: 1;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  min-height: 44px;
  max-height: 120px;
}

.send-btn {
  padding: 12px 24px;
  background: var(--blue);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.send-btn:disabled {
  background: var(--text-muted);
  cursor: not-allowed;
}
```

**Behavior**:
- Auto-expanding textarea (min 1 row, max 5 rows)
- Send button disabled when empty or loading
- Enter key: Send message
- Shift+Enter: New line
- Character limit: 2000 characters
- Focus management: Auto-focus after sending

**Validates Requirements**: 4.1-4.12, 17.5-17.8

---

## Data Models

### Conversation Model

**Purpose**: Represents a complete conversation session between a student and the AI Assistant

**Structure**:
```typescript
interface Conversation {
  id: string;              // UUID v4 format
  title: string;           // Auto-generated from first message (max 50 chars)
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp
  messages: Message[];     // Array of messages in chronological order
}
```

**Field Specifications**:
- **id**: Unique identifier generated using UUID v4 algorithm
- **title**: Extracted from first user message, truncated to 50 characters with "..." if longer
- **createdAt**: Timestamp when conversation was created (never changes)
- **updatedAt**: Timestamp of last message added (updates with each new message)
- **messages**: Ordered array of Message objects (user and assistant messages)

**Example**:
```json
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
```

**Validates Requirements**: 19.3

---

### Message Model

**Purpose**: Represents a single message within a conversation

**Structure**:
```typescript
interface Message {
  role: 'user' | 'assistant';  // Message sender type
  content: string;              // Message text content
  timestamp: string;            // ISO 8601 timestamp
}
```

**Field Specifications**:
- **role**: Either "user" (student message) or "assistant" (AI response)
- **content**: Full text of the message (max 2000 characters for user messages)
- **timestamp**: ISO 8601 formatted timestamp when message was created

**Example User Message**:
```json
{
  "role": "user",
  "content": "I have 3 assignments due this week and I'm feeling overwhelmed",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Example Assistant Message**:
```json
{
  "role": "assistant",
  "content": "**Priority Order:**\n1. Assignment A (due in 2 days)\n2. Assignment B (due in 4 days)\n3. Assignment C (due in 6 days)\n\n**Start With:**\nBegin with Assignment A since it's due soonest...\n\n**Today's Mini Plan:**\n- Spend 1 hour outlining Assignment A\n- Review requirements for Assignment B\n- Take a 10-minute break between tasks\n\n**Support Note:**\nYou've got this! Breaking it down into smaller steps makes it manageable. 💪",
  "timestamp": "2024-01-15T10:31:00.000Z"
}
```

**Validates Requirements**: 19.4

---

### localStorage Storage Format

**Purpose**: Client-side persistence of conversations structured for future database migration

**Storage Key**: `ai_conversations`

**Storage Value**: JSON string containing array of Conversation objects

**Structure**:
```javascript
{
  "ai_conversations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Help with 3 assignments due this week",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z",
      "messages": [...]
    },
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "title": "Prioritize tasks for today",
      "createdAt": "2024-01-16T09:15:00.000Z",
      "updatedAt": "2024-01-16T09:20:00.000Z",
      "messages": [...]
    }
  ]
}
```

**Storage Operations**:

1. **Save Conversation**:
```javascript
function saveConversation(conversation) {
  const conversations = loadConversations();
  const index = conversations.findIndex(c => c.id === conversation.id);
  
  if (index >= 0) {
    conversations[index] = conversation;
  } else {
    conversations.push(conversation);
  }
  
  // Enforce 50-conversation limit
  if (conversations.length > 50) {
    conversations.sort((a, b) => 
      new Date(a.updatedAt) - new Date(b.updatedAt)
    );
    conversations.shift(); // Remove oldest
  }
  
  localStorage.setItem('ai_conversations', JSON.stringify(conversations));
}
```

2. **Load Conversations**:
```javascript
function loadConversations() {
  try {
    const data = localStorage.getItem('ai_conversations');
    if (!data) return [];
    
    const conversations = JSON.parse(data);
    
    // Validate structure
    if (!Array.isArray(conversations)) return [];
    
    return conversations.filter(c => 
      c.id && c.title && c.createdAt && c.updatedAt && Array.isArray(c.messages)
    );
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return [];
  }
}
```

**Storage Limits**:
- Maximum 50 conversations per user
- When limit reached, oldest conversation (by updatedAt) is removed
- Estimated storage: ~5KB per conversation (50 conversations ≈ 250KB)

**Validates Requirements**: 5.1-5.7, 19.1-19.8

---

### Future Database Schema

**Purpose**: Planned database structure for future migration from localStorage

**Conversations Table**:
```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_conversations_user_updated 
  ON ai_conversations(user_id, updated_at DESC);
```

**Messages Table**:
```sql
CREATE TABLE ai_messages (
  id SERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) 
    REFERENCES ai_conversations(id)
);

CREATE INDEX idx_messages_conversation 
  ON ai_messages(conversation_id, timestamp ASC);
```

**Migration Strategy**:
1. Create database tables
2. Add backend endpoints for conversation CRUD operations
3. Implement data migration script (localStorage → database)
4. Update frontend to use API instead of localStorage
5. Maintain backward compatibility during transition

---

### API Request/Response Models

**POST /api/ai-chat Request**:
```typescript
interface AIChatRequest {
  conversationId: string;  // UUID of current conversation
  messages: Message[];     // Context window (last 10 messages)
}
```

**Example Request**:
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

**POST /api/ai-chat Response (Success)**:
```typescript
interface AIChatResponse {
  reply: string;  // AI-generated response text
}
```

**Example Response**:
```json
{
  "reply": "**Priority Order:**\n1. Assignment A (due in 2 days)\n2. Assignment B (due in 4 days)\n3. Assignment C (due in 6 days)\n\n**Start With:**\nBegin with Assignment A since it's due soonest...\n\n**Today's Mini Plan:**\n- Spend 1 hour outlining Assignment A\n- Review requirements for Assignment B\n- Take a 10-minute break between tasks\n\n**Support Note:**\nYou've got this! Breaking it down into smaller steps makes it manageable. 💪"
}
```

**POST /api/ai-chat Response (Error)**:
```typescript
interface AIChatErrorResponse {
  error: string;  // User-friendly error message
}
```

**Example Error Responses**:
```json
// Authentication error
{
  "error": "Unauthorized"
}

// Validation error
{
  "error": "Invalid request: messages array is required"
}

// AI service error
{
  "error": "AI service unavailable. Please try again."
}

// Timeout error
{
  "error": "Request timed out. Please try again."
}
```

**Validates Requirements**: 8.3-8.9

---

## Error Handling

### Frontend Error Handling Strategy

**Error Categories**:

1. **Network Errors**:
   - **Cause**: No internet connection, server unreachable
   - **Message**: "Network error. Please check your connection and try again."
   - **Action**: Display error message, enable retry button

2. **API Errors**:
   - **Cause**: Backend returns error response (500, 503)
   - **Message**: "Unable to reach AI service. Please try again."
   - **Action**: Display error message, enable retry button

3. **Timeout Errors**:
   - **Cause**: AI request exceeds 30-second timeout
   - **Message**: "The AI is taking longer than expected. Please try again."
   - **Action**: Display error message, enable retry button

4. **Authentication Errors**:
   - **Cause**: Invalid or expired JWT token
   - **Message**: "Session expired. Please log in again."
   - **Action**: Redirect to login page

5. **Validation Errors**:
   - **Cause**: Empty message, message too long
   - **Message**: "Please enter a message" or "Message is too long (max 2000 characters)"
   - **Action**: Display inline validation message, disable send button

6. **Storage Errors**:
   - **Cause**: localStorage quota exceeded
   - **Message**: "Storage limit reached. Please delete old conversations."
   - **Action**: Display error message, provide option to delete conversations

**Error Display Component**:

Visual representation:
```
┌─────────────────────────────────────────┐
│ ⚠️ Unable to reach AI service           │
│ Please try again in a moment.           │
│ [Retry]                                 │
└─────────────────────────────────────────┘
```

**HTML Structure**:
```html
<div class="error-message">
  <div class="error-icon">⚠️</div>
  <div class="error-content">
    <p class="error-title">Unable to reach AI service</p>
    <p class="error-description">Please try again in a moment.</p>
  </div>
  <button class="retry-btn">Retry</button>
</div>
```

**CSS Styling**:
```css
.error-message {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.error-icon {
  font-size: 24px;
}

.error-title {
  font-weight: 600;
  color: #856404;
  margin-bottom: 4px;
}

.error-description {
  font-size: 14px;
  color: #856404;
}

.retry-btn {
  margin-left: auto;
  padding: 8px 16px;
  background: var(--blue);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
```

**Error Handling Implementation**:
```javascript
async function sendMessage(message) {
  try {
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        conversationId: currentConversation.id,
        messages: getContextWindow()
      }),
      signal: AbortSignal.timeout(30000) // 30-second timeout
    });
    
    if (response.status === 401) {
      showError('Session expired. Please log in again.');
      setTimeout(() => window.location.href = '/html/login.html', 2000);
      return;
    }
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const data = await response.json();
    return data.reply;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      showError('The AI is taking longer than expected. Please try again.');
    } else if (error.message === 'Failed to fetch') {
      showError('Network error. Please check your connection and try again.');
    } else {
      showError('Unable to reach AI service. Please try again.');
    }
    throw error;
  }
}
```

**Validates Requirements**: 12.1-12.8

---

### Backend Error Handling Strategy

**Error Categories**:

1. **Authentication Errors (401)**:
   - Missing JWT token
   - Invalid JWT token
   - Expired JWT token
   - Response: `{ "error": "Unauthorized" }`

2. **Validation Errors (400)**:
   - Missing required fields (conversationId, messages)
   - Empty messages array
   - Invalid message format
   - Response: `{ "error": "Invalid request: <specific issue>" }`

3. **AI Service Errors (500)**:
   - Gemini API returns error
   - Gemini API timeout
   - Invalid API key
   - Response: `{ "error": "AI service unavailable. Please try again." }`

4. **Rate Limiting (429)** (future enhancement):
   - Too many requests from user
   - Response: `{ "error": "Too many requests. Please wait a moment." }`

**Backend Implementation**:
```javascript
// routes/ai-chat.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.post('/ai-chat', authenticateToken, async (req, res) => {
  try {
    // Validation
    const { conversationId, messages } = req.body;
    
    if (!conversationId || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Invalid request: conversationId and messages array required' 
      });
    }
    
    if (messages.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request: messages array cannot be empty' 
      });
    }
    
    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content || !['user', 'assistant'].includes(msg.role)) {
        return res.status(400).json({ 
          error: 'Invalid request: invalid message format' 
        });
      }
    }
    
    // Call AI service
    const reply = await callGeminiAPI(messages);
    
    res.json({ reply });
    
  } catch (error) {
    console.error('AI chat error:', error.message);
    
    if (error.message.includes('timeout')) {
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
```

**Error Logging**:
- Log errors to console with timestamp and error details
- Do NOT log API keys or sensitive user data
- Include request ID for debugging (future enhancement)

**Validates Requirements**: 8.9, 9.7, 12.1-12.8

---

## Testing Strategy

### Property-Based Testing Assessment

**Decision**: Property-based testing (PBT) is **NOT applicable** for this feature.

**Reasoning**:

1. **UI-Heavy Feature**: The AI Support Assistant is primarily a user interface feature with conversation management, message display, and input handling. UI rendering and interaction are not suitable for property-based testing.

2. **External Service Integration**: The core functionality depends on the Gemini API, which is an external, non-deterministic service. The AI responses vary based on the model's behavior, making it impossible to define universal properties that hold across all inputs.

3. **Side Effects Dominant**: Most operations involve side effects:
   - localStorage writes (conversation persistence)
   - API calls (network requests to backend and Gemini)
   - DOM updates (rendering messages, updating UI state)
   - Navigation (redirects, page transitions)

4. **Limited Pure Functions**: The feature has minimal pure transformation logic. Most functions are:
   - Event handlers (click, input, submit)
   - API integration functions (fetch, parse responses)
   - DOM manipulation functions (render, update, scroll)
   - Storage operations (save, load, delete)

5. **Non-Deterministic Behavior**: AI responses are inherently non-deterministic. Even with the same input, the Gemini API may return different responses, making it impossible to define properties like "for all inputs X, output Y should satisfy property P."

**Alternative Testing Approaches**:

Given the nature of this feature, the following testing strategies are more appropriate:

1. **Unit Tests**: Test individual pure functions and utility functions
2. **Integration Tests**: Test API endpoints with mocked Gemini responses
3. **End-to-End Tests**: Test complete user flows in a browser environment
4. **Manual Testing**: Validate UI/UX, responsive design, and error scenarios

---

### Unit Testing Strategy

**Scope**: Test individual functions and utility functions in isolation

**Test Framework**: Jest (JavaScript testing framework)

**Test Coverage Areas**:

#### 1. Conversation Management Functions

**Functions to Test**:
- `generateConversationTitle(message)`: Extract title from first message
- `createConversation()`: Create new conversation with UUID and timestamps
- `sortConversationsByUpdatedAt(conversations)`: Sort conversations by most recent
- `enforceConversationLimit(conversations)`: Remove oldest when limit exceeded

**Test Cases**:

```javascript
describe('generateConversationTitle', () => {
  test('should extract first 50 characters from message', () => {
    const message = 'I have 3 assignments due this week and I need help';
    const title = generateConversationTitle(message);
    expect(title).toBe('I have 3 assignments due this week and I need help');
  });
  
  test('should truncate long messages to 50 characters with ellipsis', () => {
    const message = 'I have a very long message that exceeds fifty characters and should be truncated';
    const title = generateConversationTitle(message);
    expect(title).toBe('I have a very long message that exceeds fifty ch...');
    expect(title.length).toBe(53); // 50 + '...'
  });
  
  test('should remove leading and trailing whitespace', () => {
    const message = '  Help with assignments  ';
    const title = generateConversationTitle(message);
    expect(title).toBe('Help with assignments');
  });
  
  test('should handle empty string', () => {
    const message = '';
    const title = generateConversationTitle(message);
    expect(title).toBe('New Conversation');
  });
});

describe('createConversation', () => {
  test('should create conversation with UUID v4 format', () => {
    const conversation = createConversation();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(conversation.id).toMatch(uuidRegex);
  });
  
  test('should create conversation with ISO 8601 timestamps', () => {
    const conversation = createConversation();
    expect(new Date(conversation.createdAt).toISOString()).toBe(conversation.createdAt);
    expect(new Date(conversation.updatedAt).toISOString()).toBe(conversation.updatedAt);
  });
  
  test('should create conversation with empty messages array', () => {
    const conversation = createConversation();
    expect(conversation.messages).toEqual([]);
  });
  
  test('should create conversation with empty title', () => {
    const conversation = createConversation();
    expect(conversation.title).toBe('');
  });
});

describe('sortConversationsByUpdatedAt', () => {
  test('should sort conversations by most recent first', () => {
    const conversations = [
      { id: '1', updatedAt: '2024-01-15T10:00:00.000Z' },
      { id: '2', updatedAt: '2024-01-16T10:00:00.000Z' },
      { id: '3', updatedAt: '2024-01-14T10:00:00.000Z' }
    ];
    const sorted = sortConversationsByUpdatedAt(conversations);
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('1');
    expect(sorted[2].id).toBe('3');
  });
});

describe('enforceConversationLimit', () => {
  test('should remove oldest conversation when limit exceeded', () => {
    const conversations = Array.from({ length: 51 }, (_, i) => ({
      id: `${i}`,
      updatedAt: new Date(2024, 0, i + 1).toISOString()
    }));
    const limited = enforceConversationLimit(conversations, 50);
    expect(limited.length).toBe(50);
    expect(limited.find(c => c.id === '0')).toBeUndefined(); // Oldest removed
  });
  
  test('should not modify array when under limit', () => {
    const conversations = Array.from({ length: 30 }, (_, i) => ({
      id: `${i}`,
      updatedAt: new Date(2024, 0, i + 1).toISOString()
    }));
    const limited = enforceConversationLimit(conversations, 50);
    expect(limited.length).toBe(30);
  });
});
```

#### 2. Message Handling Functions

**Functions to Test**:
- `validateMessage(message)`: Validate message format and content
- `formatTimestamp(timestamp)`: Format timestamp to human-readable format
- `extractContextWindow(messages)`: Extract last 10 messages
- `createMessage(role, content)`: Create message object

**Test Cases**:

```javascript
describe('validateMessage', () => {
  test('should accept valid user message', () => {
    const message = { role: 'user', content: 'Hello', timestamp: '2024-01-15T10:00:00.000Z' };
    expect(validateMessage(message)).toBe(true);
  });
  
  test('should accept valid assistant message', () => {
    const message = { role: 'assistant', content: 'Hi there', timestamp: '2024-01-15T10:00:00.000Z' };
    expect(validateMessage(message)).toBe(true);
  });
  
  test('should reject message with invalid role', () => {
    const message = { role: 'admin', content: 'Hello', timestamp: '2024-01-15T10:00:00.000Z' };
    expect(validateMessage(message)).toBe(false);
  });
  
  test('should reject message with empty content', () => {
    const message = { role: 'user', content: '', timestamp: '2024-01-15T10:00:00.000Z' };
    expect(validateMessage(message)).toBe(false);
  });
  
  test('should reject message exceeding max length', () => {
    const message = { role: 'user', content: 'a'.repeat(2001), timestamp: '2024-01-15T10:00:00.000Z' };
    expect(validateMessage(message)).toBe(false);
  });
});

describe('formatTimestamp', () => {
  test('should format recent timestamp as "X minutes ago"', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatTimestamp(fiveMinutesAgo.toISOString())).toBe('5 minutes ago');
  });
  
  test('should format timestamp as "X hours ago"', () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    expect(formatTimestamp(twoHoursAgo.toISOString())).toBe('2 hours ago');
  });
  
  test('should format yesterday as "Yesterday"', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(formatTimestamp(yesterday.toISOString())).toBe('Yesterday');
  });
  
  test('should format older dates as "MMM DD, YYYY"', () => {
    const oldDate = '2024-01-15T10:00:00.000Z';
    expect(formatTimestamp(oldDate)).toBe('Jan 15, 2024');
  });
});

describe('extractContextWindow', () => {
  test('should extract last 10 messages', () => {
    const messages = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
      timestamp: new Date(2024, 0, 1, 10, i).toISOString()
    }));
    const context = extractContextWindow(messages);
    expect(context.length).toBe(10);
    expect(context[0].content).toBe('Message 10');
    expect(context[9].content).toBe('Message 19');
  });
  
  test('should return all messages if less than 10', () => {
    const messages = Array.from({ length: 5 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
      timestamp: new Date(2024, 0, 1, 10, i).toISOString()
    }));
    const context = extractContextWindow(messages);
    expect(context.length).toBe(5);
  });
});
```

#### 3. localStorage Operations

**Functions to Test**:
- `saveConversation(conversation)`: Save conversation to localStorage
- `loadConversations()`: Load conversations from localStorage
- `deleteConversation(id)`: Delete conversation from localStorage

**Test Cases**:

```javascript
describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  
  describe('saveConversation', () => {
    test('should save new conversation to localStorage', () => {
      const conversation = createConversation();
      saveConversation(conversation);
      const saved = JSON.parse(localStorage.getItem('ai_conversations'));
      expect(saved).toHaveLength(1);
      expect(saved[0].id).toBe(conversation.id);
    });
    
    test('should update existing conversation', () => {
      const conversation = createConversation();
      saveConversation(conversation);
      conversation.title = 'Updated Title';
      saveConversation(conversation);
      const saved = JSON.parse(localStorage.getItem('ai_conversations'));
      expect(saved).toHaveLength(1);
      expect(saved[0].title).toBe('Updated Title');
    });
    
    test('should enforce 50-conversation limit', () => {
      const conversations = Array.from({ length: 51 }, (_, i) => ({
        ...createConversation(),
        id: `${i}`,
        updatedAt: new Date(2024, 0, i + 1).toISOString()
      }));
      conversations.forEach(saveConversation);
      const saved = JSON.parse(localStorage.getItem('ai_conversations'));
      expect(saved.length).toBe(50);
    });
  });
  
  describe('loadConversations', () => {
    test('should load conversations from localStorage', () => {
      const conversations = [createConversation(), createConversation()];
      localStorage.setItem('ai_conversations', JSON.stringify(conversations));
      const loaded = loadConversations();
      expect(loaded).toHaveLength(2);
    });
    
    test('should return empty array when no data exists', () => {
      const loaded = loadConversations();
      expect(loaded).toEqual([]);
    });
    
    test('should handle corrupted data gracefully', () => {
      localStorage.setItem('ai_conversations', 'invalid json');
      const loaded = loadConversations();
      expect(loaded).toEqual([]);
    });
    
    test('should filter out invalid conversations', () => {
      const conversations = [
        createConversation(),
        { id: '123' }, // Missing required fields
        createConversation()
      ];
      localStorage.setItem('ai_conversations', JSON.stringify(conversations));
      const loaded = loadConversations();
      expect(loaded).toHaveLength(2);
    });
  });
});
```

#### 4. Input Validation

**Functions to Test**:
- `sanitizeHTML(text)`: Escape HTML in user input
- `validateMessageLength(text)`: Check message length
- `isEmptyMessage(text)`: Check if message is empty or whitespace

**Test Cases**:

```javascript
describe('input validation', () => {
  describe('sanitizeHTML', () => {
    test('should escape HTML tags', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeHTML(input);
      expect(sanitized).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });
    
    test('should escape special characters', () => {
      const input = 'Hello & goodbye < > " \'';
      const sanitized = sanitizeHTML(input);
      expect(sanitized).toBe('Hello &amp; goodbye &lt; &gt; &quot; &#x27;');
    });
  });
  
  describe('validateMessageLength', () => {
    test('should accept message within limit', () => {
      const message = 'a'.repeat(2000);
      expect(validateMessageLength(message)).toBe(true);
    });
    
    test('should reject message exceeding limit', () => {
      const message = 'a'.repeat(2001);
      expect(validateMessageLength(message)).toBe(false);
    });
  });
  
  describe('isEmptyMessage', () => {
    test('should detect empty string', () => {
      expect(isEmptyMessage('')).toBe(true);
    });
    
    test('should detect whitespace-only string', () => {
      expect(isEmptyMessage('   \n\t  ')).toBe(true);
    });
    
    test('should accept non-empty message', () => {
      expect(isEmptyMessage('Hello')).toBe(false);
    });
  });
});
```

**Test Execution**:
```bash
npm test -- --coverage
```

**Expected Coverage**: >80% for utility functions

---

### Integration Testing Strategy

**Scope**: Test backend API endpoints with mocked external dependencies

**Test Framework**: Supertest + Jest

**Test Coverage Areas**:

#### 1. Authentication Tests

**Endpoint**: POST /api/ai-chat

**Test Cases**:

```javascript
const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');

describe('POST /api/ai-chat - Authentication', () => {
  test('should reject request without JWT token', async () => {
    const response = await request(app)
      .post('/api/ai-chat')
      .send({
        conversationId: '123',
        messages: [{ role: 'user', content: 'Hello' }]
      });
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });
  
  test('should reject request with invalid JWT token', async () => {
    const response = await request(app)
      .post('/api/ai-chat')
      .set('Authorization', 'Bearer invalid_token')
      .send({
        conversationId: '123',
        messages: [{ role: 'user', content: 'Hello' }]
      });
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });
  
  test('should accept request with valid JWT token', async () => {
    const token = jwt.sign({ userId: 1, role: 'student' }, process.env.JWT_SECRET);
    
    // Mock Gemini API
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'AI response' }] } }] })
    });
    
    const response = await request(app)
      .post('/api/ai-chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        conversationId: '123',
        messages: [{ role: 'user', content: 'Hello' }]
      });
    
    expect(response.status).toBe(200);
    expect(response.body.reply).toBeDefined();
  });
});
```

#### 2. Request Validation Tests

**Test Cases**:

```javascript
describe('POST /api/ai-chat - Request Validation', () => {
  let validToken;
  
  beforeAll(() => {
    validToken = jwt.sign({ userId: 1, role: 'student' }, process.env.JWT_SECRET);
  });
  
  test('should reject request without conversationId', async () => {
    const response = await request(app)
      .post('/api/ai-chat')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        messages: [{ role: 'user', content: 'Hello' }]
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('conversationId');
  });
  
  test('should reject request without messages', async () => {
    const response = await request(app)
      .post('/api/ai-chat')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        conversationId: '123'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('messages');
  });
  
  test('should reject request with empty messages array', async () => {
    const response = await request(app)
      .post('/api/ai-chat')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        conversationId: '123',
        messages: []
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('empty');
  });
  
  test('should reject request with invalid message format', async () => {
    const response = await request(app)
      .post('/api/ai-chat')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        conversationId: '123',
        messages: [{ role: 'invalid', content: 'Hello' }]
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('invalid message format');
  });
});
```

#### 3. Gemini API Integration Tests (with mocks)

**Test Cases**:

```javascript
describe('POST /api/ai-chat - Gemini API Integration', () => {
  let validToken;
  
  beforeAll(() => {
    validToken = jwt.sign({ userId: 1, role: 'student' }, process.env.JWT_SECRET);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('should send system prompt + context + user message to Gemini', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ 
        candidates: [{ content: { parts: [{ text: '**Priority Order:**\n1. Task A' }] } }] 
      })
    });
    
    await request(app)
      .post('/api/ai-chat')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        conversationId: '123',
        messages: [
          { role: 'user', content: 'Previous message' },
          { role: 'assistant', content: 'Previous response' },
          { role: 'user', content: 'Current message' }
        ]
      });
    
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('generativelanguage.googleapis.com'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-goog-api-key': process.env.GEMINI_API_KEY
        }),
        body: expect.stringContaining('system prompt')
      })
    );
  });
  
  test('should parse Gemini response correctly', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ 
        candidates: [{ content: { parts: [{ text: '**Priority Order:**\n1. Task A' }] } }] 
      })
    });
    
    const response = await request(app)
      .post('/api/ai-chat')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        conversationId: '123',
        messages: [{ role: 'user', content: 'Hello' }]
      });
    
    expect(response.status).toBe(200);
    expect(response.body.reply).toBe('**Priority Order:**\n1. Task A');
  });
  
  test('should handle Gemini API error gracefully', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500
    });
    
    const response = await request(app)
      .post('/api/ai-chat')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        conversationId: '123',
        messages: [{ role: 'user', content: 'Hello' }]
      });
    
    expect(response.status).toBe(500);
    expect(response.body.error).toContain('AI service unavailable');
  });
  
  test('should handle Gemini API timeout', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() => 
      new Promise((resolve) => setTimeout(resolve, 31000))
    );
    
    const response = await request(app)
      .post('/api/ai-chat')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        conversationId: '123',
        messages: [{ role: 'user', content: 'Hello' }]
      });
    
    expect(response.status).toBe(500);
    expect(response.body.error).toContain('timed out');
  }, 35000);
});
```

**Test Execution**:
```bash
npm test -- --testPathPattern=integration
```

---

### End-to-End Testing Strategy

**Scope**: Test complete user flows in a browser environment

**Test Framework**: Playwright or Cypress

**Test Coverage Areas**:

#### User Flow 1: Start New Conversation

**Steps**:
1. Navigate to dashboard
2. Click floating AI button
3. Verify AI assistant page loads
4. Click "New Chat" button
5. Verify empty chat area with welcome message
6. Verify message input is focused

**Playwright Test**:
```javascript
test('should start new conversation', async ({ page }) => {
  await page.goto('/html/dashboard.html');
  await page.click('.ai-floating-btn');
  await expect(page).toHaveURL('/html/ai-assistant.html');
  await page.click('.new-chat-btn');
  await expect(page.locator('.welcome-message')).toBeVisible();
  await expect(page.locator('#message-input')).toBeFocused();
});
```

#### User Flow 2: Send First Message

**Steps**:
1. Start new conversation
2. Type message in input area
3. Click send button
4. Verify user message appears
5. Verify loading indicator appears
6. Verify AI response appears
7. Verify conversation title generated

**Playwright Test**:
```javascript
test('should send first message and receive AI response', async ({ page }) => {
  await page.goto('/html/ai-assistant.html');
  await page.click('.new-chat-btn');
  
  await page.fill('#message-input', 'I have 3 assignments due this week');
  await page.click('.send-btn');
  
  await expect(page.locator('.message.user')).toContainText('I have 3 assignments');
  await expect(page.locator('.loading-indicator')).toBeVisible();
  
  await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 35000 });
  await expect(page.locator('.loading-indicator')).not.toBeVisible();
  
  const conversationTitle = await page.locator('.conversation-item.active .conversation-title').textContent();
  expect(conversationTitle).toContain('I have 3 assignments');
});
```

#### User Flow 3: Continue Conversation

**Steps**:
1. Send first message
2. Send second message
3. Verify AI response references previous context
4. Verify conversation updated in list

**Playwright Test**:
```javascript
test('should maintain context in conversation', async ({ page }) => {
  await page.goto('/html/ai-assistant.html');
  await page.click('.new-chat-btn');
  
  // First message
  await page.fill('#message-input', 'I have 3 assignments due this week');
  await page.click('.send-btn');
  await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 35000 });
  
  // Second message
  await page.fill('#message-input', 'Which one should I start with?');
  await page.click('.send-btn');
  await expect(page.locator('.message.assistant').nth(1)).toBeVisible({ timeout: 35000 });
  
  // Verify context is maintained (AI should reference the 3 assignments)
  const secondResponse = await page.locator('.message.assistant').nth(1).textContent();
  expect(secondResponse).toMatch(/assignment/i);
});
```

#### User Flow 4: Load Previous Conversation

**Steps**:
1. Create conversation with messages
2. Start new conversation
3. Click previous conversation in list
4. Verify all messages load
5. Send new message
6. Verify context includes previous messages

**Playwright Test**:
```javascript
test('should load and continue previous conversation', async ({ page }) => {
  await page.goto('/html/ai-assistant.html');
  
  // Create first conversation
  await page.click('.new-chat-btn');
  await page.fill('#message-input', 'First conversation message');
  await page.click('.send-btn');
  await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 35000 });
  
  // Create second conversation
  await page.click('.new-chat-btn');
  await page.fill('#message-input', 'Second conversation message');
  await page.click('.send-btn');
  await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 35000 });
  
  // Load first conversation
  await page.click('.conversation-item:first-child');
  await expect(page.locator('.message.user')).toContainText('First conversation message');
  
  // Continue first conversation
  await page.fill('#message-input', 'Follow-up message');
  await page.click('.send-btn');
  await expect(page.locator('.message.assistant').nth(1)).toBeVisible({ timeout: 35000 });
});
```

#### User Flow 5: Error Handling

**Steps**:
1. Disconnect network
2. Send message
3. Verify error message appears
4. Verify retry button works
5. Reconnect network
6. Click retry
7. Verify message sends successfully

**Playwright Test**:
```javascript
test('should handle network errors gracefully', async ({ page, context }) => {
  await page.goto('/html/ai-assistant.html');
  await page.click('.new-chat-btn');
  
  // Simulate network offline
  await context.setOffline(true);
  
  await page.fill('#message-input', 'Test message');
  await page.click('.send-btn');
  
  await expect(page.locator('.error-message')).toBeVisible();
  await expect(page.locator('.error-message')).toContainText('Network error');
  
  // Reconnect network
  await context.setOffline(false);
  
  await page.click('.retry-btn');
  await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 35000 });
  await expect(page.locator('.error-message')).not.toBeVisible();
});
```

**Test Execution**:
```bash
npx playwright test
```

---

### Manual Testing Checklist

**UI/UX Testing**:
- [ ] Floating button visible on dashboard
- [ ] Floating button positioned correctly (bottom-right, 32px margins)
- [ ] Floating button has hover effect (scale + brightness)
- [ ] AI assistant page matches StudyBalance design system
- [ ] Conversation list panel width is 280px
- [ ] Conversation list is scrollable
- [ ] Chat area is scrollable
- [ ] Auto-scroll to latest message works
- [ ] User messages styled correctly (blue background, right-aligned)
- [ ] AI messages styled correctly (white background, left-aligned, structured format)
- [ ] Timestamps formatted correctly ("X minutes ago", "Yesterday", etc.)
- [ ] Loading indicator appears during AI response
- [ ] Loading indicator is animated (pulsing dots)
- [ ] Empty states display correctly (conversation list, chat area)
- [ ] Welcome message includes example prompts
- [ ] Error messages styled correctly (warning color, icon, retry button)

**Responsive Design Testing**:
- [ ] Desktop (1920x1080): Two-panel layout side-by-side
- [ ] Laptop (1366x768): Two-panel layout side-by-side
- [ ] Tablet (768x1024): Two-panel layout side-by-side
- [ ] Mobile (375x667): Stacked layout, conversation list collapsible
- [ ] Floating button visible and accessible on all screen sizes
- [ ] Message input area resizes appropriately on mobile keyboards
- [ ] Touch targets minimum 44x44 pixels on mobile

**Functionality Testing**:
- [ ] New conversation created successfully
- [ ] Conversation ID is valid UUID v4
- [ ] Message sent successfully
- [ ] AI response received and displayed
- [ ] Conversation saved to localStorage
- [ ] Conversation loaded from localStorage on page refresh
- [ ] Context window includes last 10 messages
- [ ] Conversation title auto-generated from first message
- [ ] Conversation title truncated to 50 characters with "..."
- [ ] Conversations sorted by most recent (updatedAt)
- [ ] Active conversation highlighted in list
- [ ] Clicking conversation loads it into chat area
- [ ] Send button disabled when input is empty
- [ ] Send button disabled during loading
- [ ] Enter key sends message
- [ ] Shift+Enter creates new line
- [ ] Message input clears after sending
- [ ] 50-conversation limit enforced (oldest removed)

**Error Handling Testing**:
- [ ] Network error displays correctly (disconnect WiFi, send message)
- [ ] API error displays correctly (stop backend server, send message)
- [ ] Timeout error displays correctly (mock slow API response)
- [ ] Empty message validation works (try sending empty message)
- [ ] Message too long validation works (try sending 2001+ characters)
- [ ] localStorage full error displays correctly (fill localStorage, send message)
- [ ] Retry button works after error
- [ ] Authentication error redirects to login (use expired token)

**Security Testing**:
- [ ] JWT token required for API access (remove token, send message)
- [ ] Invalid JWT token rejected (use invalid token, send message)
- [ ] API key not exposed in frontend (check Network tab, check source code)
- [ ] User can only access own conversations (check localStorage scope)
- [ ] HTML in user messages is escaped (try sending `<script>alert('xss')</script>`)

**Performance Testing**:
- [ ] Page loads in under 2 seconds
- [ ] AI response received in under 30 seconds
- [ ] Conversation list renders smoothly with 50 conversations
- [ ] Chat area scrolls smoothly with 100+ messages
- [ ] localStorage operations complete in under 100ms

**Accessibility Testing**:
- [ ] Floating button has aria-label
- [ ] Send button has aria-label
- [ ] Loading indicator has aria-live="polite"
- [ ] Error messages have role="alert"
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators visible on all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Touch targets minimum 44x44 pixels

---

## Security Considerations

### Authentication and Authorization

**JWT Token Validation**:
- All API requests require valid JWT token in Authorization header
- Token validated using existing `authenticateToken` middleware
- Invalid or expired tokens return 401 Unauthorized
- No API access without authentication

**User Isolation**:
- Conversations stored in localStorage scoped to browser session
- Future database implementation will enforce user_id foreign key
- No cross-user conversation access possible

**Implementation**:
```javascript
// middleware/auth.js (existing)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    next();
  });
}
```

---

### API Key Protection

**Storage**:
- Gemini API key stored in `.env` file
- Never committed to version control (`.env` in `.gitignore`)
- Only accessible to backend server

**Usage**:
- API key only used in backend code
- Never sent to frontend in any response
- Never logged in application logs

**Environment Variable**:
```
GEMINI_API_KEY=your_api_key_here
```

**Backend Implementation**:
```javascript
// routes/ai-chat.js
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable not set');
  process.exit(1);
}

async function callGeminiAPI(messages) {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY // Never expose this
      },
      body: JSON.stringify({ contents: messages })
    }
  );
  
  // Never log API key
  if (!response.ok) {
    console.error('Gemini API error:', response.status);
    throw new Error('AI service unavailable');
  }
  
  return response.json();
}
```

---

### Input Validation and Sanitization

**Frontend Validation**:
- Message length limited to 2000 characters
- Empty messages rejected
- HTML escaped before display

**Backend Validation**:
- Request body structure validated
- Message array validated (not empty, valid format)
- Message role validated (only "user" or "assistant")
- Message content validated (not empty)

**HTML Sanitization**:
```javascript
function sanitizeHTML(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
```

---

### Rate Limiting (Future Enhancement)

**Recommendation**: Implement rate limiting to prevent abuse

**Strategy**:
- Limit: 10 requests per minute per user
- Use `express-rate-limit` middleware
- Return 429 Too Many Requests when exceeded

**Implementation** (future):
```javascript
const rateLimit = require('express-rate-limit');

const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: 'Too many requests. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user.userId // Rate limit per user
});

router.post('/ai-chat', authenticateToken, aiChatLimiter, async (req, res) => {
  // Handle request
});
```

---

## Performance Optimization

### Frontend Performance

**Lazy Loading**:
- Load conversations on demand (not all at once)
- Render only visible conversation items (virtual scrolling for future enhancement)

**Debouncing**:
- Debounce auto-save to localStorage (500ms delay)
- Prevents excessive writes during rapid message exchanges

**DOM Optimization**:
- Use DocumentFragment for batch message rendering
- Minimize reflows and repaints
- Use CSS transforms for animations (GPU-accelerated)

**Implementation**:
```javascript
// Debounced save
let saveTimeout;
function debouncedSave(conversation) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveConversation(conversation);
  }, 500);
}

// Batch message rendering
function renderMessages(messages) {
  const fragment = document.createDocumentFragment();
  messages.forEach(message => {
    const messageEl = createMessageElement(message);
    fragment.appendChild(messageEl);
  });
  messagesContainer.appendChild(fragment);
}
```

---

### Backend Performance

**Context Window Limit**:
- Only send last 10 messages to Gemini API
- Reduces API payload size
- Faster response times

**Timeout**:
- 30-second timeout for Gemini API calls
- Prevents hanging requests
- Returns user-friendly error message

**Caching** (future enhancement):
- Cache system prompt (doesn't change)
- Cache common responses (if applicable)

---

### localStorage Optimization

**Conversation Limit**:
- Maximum 50 conversations per user
- Prevents localStorage quota issues
- Oldest conversations removed automatically

**Compression** (future enhancement):
- Compress old conversations using LZ-string
- Reduces storage footprint
- Decompress on load

---

## Accessibility

### Keyboard Navigation

**Tab Order**:
1. Floating button
2. New Chat button
3. Conversation list items
4. Message input area
5. Send button

**Keyboard Shortcuts**:
- **Enter**: Send message (when input focused)
- **Shift+Enter**: New line in message input
- **Escape**: Close conversation list on mobile (future enhancement)

---

### Screen Reader Support

**ARIA Labels**:
```html
<button class="ai-floating-btn" aria-label="Open AI Study Support">
  🤖
</button>

<button class="send-btn" aria-label="Send message">
  Send
</button>

<div class="loading-indicator" aria-live="polite" aria-label="AI is thinking">
  <div class="loading-dots"></div>
</div>

<div class="error-message" role="alert">
  <p>Unable to reach AI service. Please try again.</p>
</div>
```

**Live Regions**:
- Loading indicator: `aria-live="polite"`
- Error messages: `role="alert"` (immediate announcement)
- New messages: Announced automatically by screen readers

---

### Visual Accessibility

**Color Contrast**:
- Text on blue background: White text (contrast ratio > 4.5:1)
- Text on white background: Dark text (contrast ratio > 4.5:1)
- Error messages: High contrast warning colors

**Focus Indicators**:
```css
button:focus,
textarea:focus,
.conversation-item:focus {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}
```

**Touch Targets**:
- Minimum 44x44 pixels for all interactive elements
- Adequate spacing between touch targets (8px minimum)

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
    ├── .env (add GEMINI_API_KEY)
    └── server.js (register ai-chat route)
```

---

### Dependencies

**Frontend**:
- No new dependencies (vanilla JavaScript)
- Uses existing StudyBalance design system

**Backend**:
- `@google/generative-ai` (Gemini SDK) OR
- `axios` (for manual API calls)

**Installation**:
```bash
cd backend
npm install @google/generative-ai
```

---

### Environment Variables

**Required**:
```
GEMINI_API_KEY=your_api_key_here
```

**Setup**:
1. Create `.env` file in `backend/` directory
2. Add `GEMINI_API_KEY` variable
3. Obtain API key from Google AI Studio
4. Never commit `.env` to version control

---

### System Prompt Definition

**Location**: Backend code (routes/ai-chat.js)

**Content**:
```javascript
const SYSTEM_PROMPT = `You are an academic workload organizer for students. Your role is to help students organize their thoughts about academic tasks, prioritize their workload based on urgency and importance, suggest actionable first steps, and provide calming, supportive guidance.

Always respond in this structure:

**Priority Order:**
[List priorities numbered 1, 2, 3... based on urgency and importance]

**Start With:**
[Describe the single most important first action to take right now]

**Today's Mini Plan:**
[Provide 2-3 specific, actionable steps the student can complete today]

**Support Note:**
[Write a brief, encouraging message to help the student feel supported]

Use previous conversation context to provide continuity and remember what the student has told you.`;
```

**Configuration**:
- Stored as constant in backend code
- Can be moved to environment variable or config file for easier updates
- Sent as first message in conversation context to Gemini API

---

## Design Validation

### Requirements Coverage

This design document addresses all 20 requirements with 177 acceptance criteria:

✅ **Requirement 1**: Floating Button Access (8 criteria)  
✅ **Requirement 2**: AI Assistant Page Layout (11 criteria)  
✅ **Requirement 3**: Start New Conversation (7 criteria)  
✅ **Requirement 4**: Send Message to AI Assistant (12 criteria)  
✅ **Requirement 5**: Conversation Persistence (7 criteria)  
✅ **Requirement 6**: Conversation List Display (7 criteria)  
✅ **Requirement 7**: Continue Existing Conversation (7 criteria)  
✅ **Requirement 8**: Backend AI Integration Endpoint (10 criteria)  
✅ **Requirement 9**: AI Provider Integration (7 criteria)  
✅ **Requirement 10**: AI Assistant Behavior and Response Format (10 criteria)  
✅ **Requirement 11**: Message Display Formatting (9 criteria)  
✅ **Requirement 12**: Error Handling and User Feedback (8 criteria)  
✅ **Requirement 13**: Responsive Design and Accessibility (9 criteria)  
✅ **Requirement 14**: Conversation Title Generation (7 criteria)  
✅ **Requirement 15**: Security and Authentication (8 criteria)  
✅ **Requirement 16**: Design System Consistency (10 criteria)  
✅ **Requirement 17**: Loading States and User Feedback (8 criteria)  
✅ **Requirement 18**: Empty States (7 criteria)  
✅ **Requirement 19**: Data Structure and Storage Format (8 criteria)  
✅ **Requirement 20**: System Prompt Definition (7 criteria)

---

### Design Principles Validation

✅ **Security First**: API keys protected, JWT authentication required, input sanitization  
✅ **User Experience**: Single-click access, persistent conversations, structured responses  
✅ **Design Consistency**: Follows StudyBalance design system throughout  
✅ **Future-Ready**: localStorage structure designed for database migration  
✅ **Responsive**: Fully functional on all device sizes  

---

## Next Steps

1. ✅ **Design Review**: Design document completed and ready for review
2. **Create Tasks**: Break down implementation into tasks (tasks.md)
3. **Implementation**: Follow tasks in priority order
4. **Testing**: Execute testing strategy (unit, integration, E2E)
5. **Deployment**: Deploy to production

---

## Summary

This design document provides a comprehensive technical specification for the AI Support Assistant feature, including:

- **Architecture**: Client-server with external AI service integration
- **Components**: Detailed design for all UI components and their interactions
- **Data Models**: Structured data formats for conversations and messages
- **API Design**: Secure backend endpoint with Gemini API integration
- **Error Handling**: Comprehensive error handling strategy for frontend and backend
- **Testing Strategy**: Unit, integration, and E2E testing approaches (no PBT due to UI-heavy nature)
- **Security**: JWT authentication, API key protection, input validation
- **Performance**: Optimization strategies for frontend, backend, and storage
- **Accessibility**: WCAG AA compliance with keyboard navigation and screen reader support

The design follows the approved design decisions and addresses all requirements with clear implementation guidance.
