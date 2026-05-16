# AI Support Assistant — Requirements Decisions

## Feature Overview

Add a dedicated AI-powered study support assistant to help students organize their academic workload, prioritize tasks, and manage stress through natural conversation.

---

## Scope Decisions

### In Scope
- ✅ Floating AI button on dashboard (fixed position, circular, modern style)
- ✅ Dedicated AI assistant page (ai-assistant.html)
- ✅ Natural language input for student stress, confusion, workload questions
- ✅ AI responses focused on task prioritization and action planning
- ✅ Conversation persistence (save and reload previous chats)
- ✅ Conversation history UI (list of saved conversations)
- ✅ Continue existing conversations with context awareness
- ✅ Auto-generate conversation titles from first user message
- ✅ Backend API endpoint for secure AI integration
- ✅ Integration with Gemini or Claude API
- ✅ Responsive design (desktop, laptop, tablet, mobile)

### Out of Scope (for this feature)
- ❌ Voice input/output
- ❌ AI-generated task creation (assistant only suggests, doesn't modify data)
- ❌ Multi-language support (English only for now)
- ❌ AI training on user-specific data
- ❌ Export conversation history
- ❌ Share conversations with others

---

## User Roles

### Primary User: Student
- Can access AI assistant from dashboard
- Can start new conversations
- Can view and continue previous conversations
- Can ask about workload, stress, task prioritization
- Receives structured AI guidance

---

## Main Features

### 1. Floating AI Button
- Fixed position on dashboard
- Circular design with AI icon or "AI" label
- Matches StudyBalance design system (blue/teal theme)
- Clicking opens ai-assistant.html

### 2. AI Assistant Page
- Same sidebar navigation as other student pages
- Page title: "AI Study Support"
- Two-panel layout:
  - **Left panel**: Conversation list (saved chats)
  - **Right panel**: Active chat area
- "New Chat" button at top
- Message input area at bottom
- Send button
- Chat bubbles or message cards for display

### 3. Conversation Management
- Save conversations automatically
- Each conversation has:
  - Unique ID
  - Auto-generated title (from first user message)
  - Timestamp
  - List of messages (user/AI, content, timestamp)
- Click conversation in left panel to load it
- Continue conversation with full context

### 4. AI Behavior
- Acts as **academic workload organizer**, not generic chatbot
- Focuses on:
  - Calming student stress
  - Organizing thoughts
  - Prioritizing tasks
  - Suggesting what to do first
  - Creating short action plans
- Uses conversation history for context-aware responses

### 5. AI Response Format
Structured output:
- **Priority Order**: What matters most
- **Start With**: First action to take
- **Today's Mini Plan**: Short actionable steps
- **Support Note**: Encouraging message

---

## Business Rules

### Conversation Rules
1. Each conversation must have at least one user message
2. Conversation title auto-generated from first user message (max 50 chars)
3. Conversations sorted by most recent activity
4. AI responses must reference previous messages in same conversation

### AI Behavior Rules
1. AI must NOT act as generic chatbot
2. AI must focus on academic workload organization
3. AI must provide structured responses (Priority/Start/Plan/Support)
4. AI must be supportive and calming in tone
5. AI must NOT create, modify, or delete tasks directly

### Security Rules
1. API key must NEVER be exposed in frontend code
2. All AI requests must go through backend endpoint
3. Conversations are user-specific (no cross-user access)
4. Authentication required to access AI assistant

---

## Technical Choices

### Frontend
- **HTML**: ai-assistant.html (follows existing page structure)
- **CSS**: Extend style.css (maintain design consistency)
- **JavaScript**: ai-assistant.js (handles UI, API calls, conversation management)
- **Storage**: localStorage for demo/temporary (structured for future DB migration)

### Backend
- **Framework**: Express.js (existing backend)
- **Endpoint**: POST `/api/ai-chat`
- **AI Provider**: Gemini or Claude API (user preference)
- **Environment**: API key in `.env` file
- **Request Format**:
  ```json
  {
    "conversationId": "uuid",
    "messages": [
      {"role": "user", "content": "..."},
      {"role": "assistant", "content": "..."}
    ]
  }
  ```
- **Response Format**:
  ```json
  {
    "reply": "AI response text"
  }
  ```

### Data Structure (localStorage)
```javascript
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Auto-generated title",
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp",
      "messages": [
        {
          "role": "user|assistant",
          "content": "message text",
          "timestamp": "ISO timestamp"
        }
      ]
    }
  ]
}
```

### AI Prompt Engineering
System prompt for AI model:
```
You are an academic workload organizer for students. Your role is to:
1. Help students organize their thoughts about academic tasks
2. Prioritize their workload based on urgency and importance
3. Suggest actionable first steps
4. Provide calming, supportive guidance

Always respond in this structure:
- Priority Order: [list priorities]
- Start With: [first action]
- Today's Mini Plan: [2-3 actionable steps]
- Support Note: [encouraging message]

Use previous conversation context to provide continuity.
```

---

## Implementation Priorities

### Phase 1: Frontend UI (High Priority)
1. Create ai-assistant.html with two-panel layout
2. Add floating AI button to dashboard.html
3. Style components in style.css (maintain design system)
4. Create ai-assistant.js with:
   - Conversation list rendering
   - Message display
   - Input handling
   - localStorage management

### Phase 2: Backend Integration (High Priority)
1. Create `/api/ai-chat` endpoint in backend
2. Integrate Gemini or Claude API
3. Implement prompt engineering for academic focus
4. Handle conversation context in API calls
5. Secure API key in environment variables

### Phase 3: Polish (Medium Priority)
1. Auto-scroll to latest message
2. Loading indicators during AI response
3. Error handling (API failures, network issues)
4. Empty states (no conversations, no messages)
5. Mobile responsive refinements

### Phase 4: Future Enhancements (Low Priority)
1. Migrate from localStorage to database
2. Conversation search
3. Delete conversations
4. Export conversation history
5. AI suggestions based on actual task data from database

---

## Testing Approach

### Manual Testing
1. **UI Testing**:
   - Floating button appears on dashboard
   - AI assistant page loads correctly
   - Responsive on mobile, tablet, desktop
   - Design matches StudyBalance theme

2. **Conversation Flow**:
   - Start new conversation
   - Send message and receive AI response
   - Save conversation automatically
   - Load previous conversation
   - Continue conversation with context

3. **Edge Cases**:
   - Empty conversation list
   - Very long messages
   - Network failure during AI call
   - localStorage quota exceeded

### Integration Testing
1. Backend endpoint responds correctly
2. AI API integration works (Gemini/Claude)
3. Conversation context passed correctly
4. API key secured (not exposed in frontend)

### User Acceptance Testing
1. Student can easily access AI assistant
2. AI responses are helpful and structured
3. Conversation history is preserved
4. UI is intuitive and matches existing design

---

## Design Consistency Requirements

### Must Maintain
- Light background (#f4f6fb)
- White cards (#ffffff)
- Blue/teal color theme (--blue: #2f6fe4)
- Rounded corners (--radius: 16px)
- Subtle shadows (--shadow)
- Responsive layout
- Same sidebar navigation
- Same topbar structure
- Consistent typography
- Consistent button styles

### New Components Needed
- Floating action button (circular, fixed position)
- Conversation list item (clickable, shows title + timestamp)
- Message bubble (user vs AI styling)
- Chat input area (textarea + send button)
- Empty state for conversations
- Loading indicator for AI response

---

## Open Questions for User

1. **AI Provider Preference**: Gemini or Claude? (affects API integration)
2. **Conversation Limit**: Should we limit number of saved conversations? (e.g., max 50)
3. **Message History**: How many messages to send as context? (e.g., last 10 messages)
4. **Database Migration**: Should we plan for database storage now, or start with localStorage?
5. **Floating Button Position**: Bottom-right corner? (standard position)

---

## Success Criteria

✅ Student can access AI assistant from dashboard with one click  
✅ Student can have natural conversations about academic stress  
✅ AI provides structured, helpful responses focused on task organization  
✅ Conversations are saved and can be continued later  
✅ UI matches existing StudyBalance design perfectly  
✅ API key is secure (not exposed in frontend)  
✅ Feature works on mobile and desktop  
✅ No impact on existing features (dashboard, tasks, courses remain unchanged)
