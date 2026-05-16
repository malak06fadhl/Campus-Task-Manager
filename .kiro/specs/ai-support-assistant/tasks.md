# Implementation Plan: AI Support Assistant

## Overview

This implementation plan breaks down the AI Support Assistant feature into discrete, actionable coding tasks. The feature adds a conversational AI interface to StudyBalance, allowing students to get structured guidance for organizing their academic workload through natural language interaction.

**Implementation Approach:**
- Backend-first: Build and test the API endpoint independently
- Frontend structure: Create HTML/CSS layout
- Frontend logic: Implement conversation management and chat interface
- Integration: Connect frontend to backend with comprehensive error handling
- Testing: Manual validation at checkpoints

**Technology Stack:**
- Backend: Node.js + Express.js + Gemini API SDK
- Frontend: Vanilla JavaScript (no frameworks)
- Storage: localStorage (structured for future database migration)
- Authentication: JWT (existing pattern)

---

## Tasks

- [ ] 1. Backend Setup and Gemini API Integration
  - [ ] 1.1 Install Gemini API SDK dependency
    - Run `npm install @google/generative-ai --save` in the backend directory
    - Verify installation in package.json
    - _Requirements: 9.1_
  
  - [ ] 1.2 Create environment configuration for API key
    - Create or update `backend/.env` file with `GEMINI_API_KEY=your_api_key_here`
    - Verify `.env` is in `.gitignore` to prevent committing secrets
    - Update `backend/config.js` to export `GEMINI_API_KEY` from environment variables
    - _Requirements: 9.2, 15.7_
  
  - [ ] 1.3 Create AI chat route file with Gemini integration
    - Create `backend/routes/ai-chat.js`
    - Import required dependencies: express, @google/generative-ai, authenticateToken middleware
    - Initialize Gemini API client with API key from config
    - Define system prompt as constant (from requirements 20.2-20.5)
    - Implement `callGeminiAPI(messages)` helper function that:
      - Constructs conversation history with system prompt
      - Sends request to Gemini API with 30-second timeout
      - Returns AI-generated response text
      - Handles API errors and timeouts
    - _Requirements: 8.1, 9.1-9.7, 20.1-20.7_
  
  - [ ] 1.4 Implement POST /api/ai-chat endpoint with validation
    - Create POST route at `/api/ai-chat` with authenticateToken middleware
    - Validate request body contains `conversationId` and `messages` fields
    - Validate `messages` is a non-empty array
    - Validate each message has `role` (user/assistant) and `content` fields
    - Return 400 error with descriptive message for validation failures
    - Call `callGeminiAPI(messages)` with validated messages
    - Return JSON response with `reply` field containing AI response
    - Implement error handling for authentication (401), validation (400), and AI service errors (500)
    - _Requirements: 8.1-8.10, 9.5-9.7, 12.1-12.8_
  
  - [ ] 1.5 Register AI chat route in server.js
    - Import `backend/routes/ai-chat.js` in `backend/server.js`
    - Register route with `app.use('/api', require('./routes/ai-chat'))`
    - Place registration after existing routes but before 404 handler
    - _Requirements: 8.1_

- [ ] 2. Checkpoint - Backend Testing
  - Test the backend endpoint independently using Postman or curl
  - Verify authentication works (401 for missing/invalid JWT)
  - Verify validation works (400 for invalid request body)
  - Verify AI integration works (200 with reply field)
  - Verify error handling works (500 for API failures)
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Frontend HTML Structure
  - [ ] 3.1 Create AI assistant page HTML file
    - Create `html/ai-assistant.html`
    - Copy standard StudyBalance page structure (sidebar, topbar, main content) from existing pages
    - Set page title to "AI Study Support"
    - Include standard CSS: `<link rel="stylesheet" href="../css/style.css">`
    - Include standard JS: `<script src="../js/main.js"></script>`
    - Include AI-specific JS: `<script src="../js/ai-assistant.js"></script>`
    - _Requirements: 2.1-2.3_
  
  - [ ] 3.2 Implement two-panel layout structure
    - Create `.ai-assistant-container` main element
    - Add page title `<h1>AI Study Support</h1>`
    - Create `.ai-layout` container with flexbox layout
    - Add left panel: `.conversation-list-panel` (280px fixed width)
    - Add right panel: `.chat-panel` (flexible width)
    - _Requirements: 2.4-2.6_
  
  - [ ] 3.3 Build conversation list panel HTML
    - Add "New Chat" button at top: `<button class="new-chat-btn">+ New Chat</button>`
    - Add conversation list container: `<div class="conversation-list"></div>`
    - Add empty state template (hidden by default): "No conversations yet. Start a new chat!"
    - _Requirements: 2.7, 6.6_
  
  - [ ] 3.4 Build chat panel HTML structure
    - Add messages container: `<div class="messages-container"></div>`
    - Add welcome message template (shown for new conversations)
    - Add loading indicator template (hidden by default): "AI is thinking..." with animated dots
    - Add message input area at bottom with textarea and send button
    - Set textarea placeholder: "Tell me about your workload..."
    - Set textarea maxlength to 2000 characters
    - _Requirements: 2.8-2.9, 4.1-4.12, 17.1-17.8, 18.4-18.7_
  
  - [ ] 3.5 Add floating AI button to dashboard
    - Open `html/dashboard.html`
    - Add floating button HTML before closing `</body>` tag:
      ```html
      <a href="ai-assistant.html" class="ai-floating-btn" title="AI Study Support">
        🤖
      </a>
      ```
    - _Requirements: 1.1-1.8_

- [ ] 4. Frontend CSS Styling
  - [ ] 4.1 Style floating AI button
    - Open `css/style.css`
    - Add `.ai-floating-btn` styles: fixed position (bottom: 32px, right: 32px), circular (56px diameter), blue background, white text, shadow, z-index 100
    - Add hover effect: scale(1.05) and brightness(1.1)
    - Add mobile responsive adjustments (bottom: 16px, right: 16px on small screens)
    - _Requirements: 1.1-1.8, 13.4_
  
  - [ ] 4.2 Style AI assistant page layout
    - Add `.ai-assistant-container` styles: standard page container
    - Add `.ai-layout` styles: flexbox row, gap 24px, height calc(100vh - 200px)
    - Add `.conversation-list-panel` styles: width 280px, flex-shrink 0, border-right
    - Add `.chat-panel` styles: flex 1, flexbox column
    - Add responsive breakpoint (@media max-width: 768px): stack panels vertically, remove fixed width
    - _Requirements: 2.4-2.11, 13.1-13.3_
  
  - [ ] 4.3 Style conversation list panel components
    - Add `.new-chat-btn` styles: primary button, full width, blue background
    - Add `.conversation-list` styles: scrollable, overflow-y auto
    - Add `.conversation-item` styles: padding 12px, card background, border-bottom, cursor pointer, hover effect
    - Add `.conversation-item.active` styles: blue-soft background, left border accent
    - Add `.conversation-title` styles: font-weight 500, text overflow ellipsis
    - Add `.conversation-time` styles: font-size 12px, muted color
    - Add `.empty-state` styles: centered, icon + text
    - _Requirements: 6.1-6.7_
  
  - [ ] 4.4 Style chat panel message bubbles
    - Add `.messages-container` styles: flex 1, overflow-y auto, padding 16px
    - Add `.message` base styles: margin-bottom 12px, max-width 80%
    - Add `.message.user` styles: margin-left auto, blue background, white text, border-radius 16px 16px 4px 16px, padding 12px 16px
    - Add `.message.assistant` styles: card background, border, border-radius 16px 16px 16px 4px, padding 16px
    - Add `.message-timestamp` styles: font-size 11px, opacity 0.7, margin-top 4px
    - Add `.message.assistant strong` styles: blue color, display block, margin-top 12px (for structured response sections)
    - _Requirements: 11.1-11.9_
  
  - [ ] 4.5 Style message input area and loading states
    - Add `.message-input-area` styles: flexbox row, gap 12px, padding 16px, border-top, card background
    - Add `#message-input` textarea styles: flex 1, padding 12px, border, border-radius 8px, min-height 44px, max-height 120px, resize none
    - Add `.send-btn` styles: padding 12px 24px, blue background, white text, border-radius 8px
    - Add `.send-btn:disabled` styles: muted background, not-allowed cursor
    - Add `.loading-indicator` styles: flexbox row, gap 8px, padding 12px
    - Add `.loading-dots` animation: three pulsing dots
    - Add `.welcome-message` styles: centered, icon + heading + description + example prompts
    - Add `.error-message` styles: warning background (#fff3cd), border, padding, flexbox row with icon
    - _Requirements: 4.1-4.12, 12.1-12.8, 17.1-17.8, 18.4-18.7_

- [ ] 5. Checkpoint - Frontend Structure Validation
  - Open ai-assistant.html in browser
  - Verify page layout renders correctly (sidebar, topbar, two-panel layout)
  - Verify floating button appears on dashboard and links to AI page
  - Verify responsive design works on mobile viewport (< 768px)
  - Verify all UI elements are styled consistently with StudyBalance design system
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Conversation Management Logic
  - [ ] 6.1 Create AI assistant JavaScript file with initialization
    - Create `js/ai-assistant.js`
    - Wrap code in IIFE: `(function () { 'use strict'; ... })();`
    - Define API base URL constant: `var API = 'http://localhost:3000/api';`
    - Define storage key constant: `var STORAGE_KEY = 'ai_conversations';`
    - Define state variables: `var currentConversation = null;` and `var conversations = [];`
    - Add DOMContentLoaded event listener for initialization
    - Call `SB.guardStudent()` to ensure authentication
    - _Requirements: 15.1-15.2_
  
  - [ ] 6.2 Implement localStorage operations
    - Implement `loadConversations()` function:
      - Read from localStorage using STORAGE_KEY
      - Parse JSON, handle errors with try-catch
      - Validate array structure, filter invalid conversations
      - Return array of conversations sorted by updatedAt (newest first)
      - Return empty array if no data or parse error
    - Implement `saveConversation(conversation)` function:
      - Load existing conversations
      - Find and update existing conversation by id, or append new conversation
      - Enforce 50-conversation limit (remove oldest by updatedAt if exceeded)
      - Stringify and save to localStorage
      - Handle quota exceeded errors
    - _Requirements: 5.1-5.7, 19.1-19.8_
  
  - [ ] 6.3 Implement UUID generation helper
    - Implement `generateUUID()` function using existing pattern from auth.js:
      ```javascript
      function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (Math.random() * 16) | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });
      }
      ```
    - _Requirements: 19.7_
  
  - [ ] 6.4 Implement conversation title generation
    - Implement `generateTitle(messageContent)` function:
      - Trim whitespace from message content
      - If empty, return "New Conversation"
      - If length <= 50, return full content
      - If length > 50, return first 50 characters + "..."
    - _Requirements: 14.1-14.7_
  
  - [ ] 6.5 Implement new conversation creation
    - Implement `createNewConversation()` function:
      - Generate UUID for conversation id
      - Create conversation object with id, title: "New Conversation", createdAt: now, updatedAt: now, messages: []
      - Set as currentConversation
      - Do NOT save to localStorage yet (wait for first message)
      - Clear chat panel and show welcome message
      - Focus message input area
    - Attach click handler to "New Chat" button that calls `createNewConversation()`
    - _Requirements: 3.1-3.7_
  
  - [ ] 6.6 Implement conversation list rendering
    - Implement `renderConversationList()` function:
      - Get conversation list container element
      - If conversations array is empty, show empty state
      - Otherwise, generate HTML for each conversation:
        - Conversation item div with data-conversation-id attribute
        - Icon (📝), title, and formatted timestamp
        - Add "active" class if conversation id matches currentConversation.id
      - Attach click handlers to conversation items that call `loadConversation(id)`
    - Implement `formatTimestamp(isoString)` helper for relative time:
      - < 1 hour: "X minutes ago"
      - < 24 hours: "X hours ago"
      - Yesterday: "Yesterday"
      - Older: "MMM DD, YYYY"
    - _Requirements: 6.1-6.7_

- [ ] 7. Chat Interface Logic
  - [ ] 7.1 Implement message rendering
    - Implement `renderMessages()` function:
      - Get messages container element
      - Clear existing content
      - If currentConversation is null or has no messages, show welcome message
      - Otherwise, iterate through currentConversation.messages:
        - Create message div with class "message" and role class ("user" or "assistant")
        - Add message content (escape HTML for user messages, allow formatting for assistant)
        - Add timestamp (formatted with formatTimestamp helper)
      - Auto-scroll to bottom of messages container
    - _Requirements: 7.1-7.7, 11.1-11.9_
  
  - [ ] 7.2 Implement message input handling
    - Get message input textarea and send button elements
    - Implement `updateSendButtonState()` function:
      - Enable send button only if textarea has non-empty trimmed value and not currently loading
      - Disable otherwise
    - Attach input event listener to textarea that calls `updateSendButtonState()`
    - Implement textarea auto-expand behavior (min 1 row, max 5 rows)
    - Attach keydown event listener for Enter key (send) and Shift+Enter (new line)
    - _Requirements: 4.1-4.12, 13.8-13.9_
  
  - [ ] 7.3 Implement send message function
    - Implement `sendMessage()` async function:
      - Get message content from textarea, trim whitespace
      - Validate not empty and <= 2000 characters
      - If currentConversation is null, create new conversation
      - Create user message object: {role: "user", content, timestamp: new Date().toISOString()}
      - Add user message to currentConversation.messages
      - If first message, generate and set conversation title
      - Update currentConversation.updatedAt to now
      - Save conversation to localStorage
      - Render messages (shows user message immediately)
      - Clear textarea and disable send button
      - Show loading indicator
      - Call `callAIAPI()` to get AI response
      - Hide loading indicator when response received
      - Re-enable send button and focus textarea
    - Attach click handler to send button that calls `sendMessage()`
    - _Requirements: 4.1-4.12, 14.1-14.7_
  
  - [ ] 7.4 Implement loading indicator display
    - Implement `showLoadingIndicator()` function:
      - Get messages container
      - Create loading indicator element with animated dots and "AI is thinking..." text
      - Append to messages container
      - Auto-scroll to bottom
    - Implement `hideLoadingIndicator()` function:
      - Find and remove loading indicator element from messages container
    - _Requirements: 17.1-17.8_
  
  - [ ] 7.5 Implement conversation loading
    - Implement `loadConversation(conversationId)` function:
      - Find conversation in conversations array by id
      - If not found, return
      - Set as currentConversation
      - Render messages
      - Update conversation list to highlight active conversation
      - Focus message input area
    - _Requirements: 7.1-7.7_

- [ ] 8. Backend Integration and Error Handling
  - [ ] 8.1 Implement API call function
    - Implement `callAIAPI()` async function:
      - Get JWT token from SB.getToken()
      - Extract last 10 messages from currentConversation for context window
      - Create request body: {conversationId: currentConversation.id, messages: contextWindow}
      - Make POST request to /api/ai-chat with:
        - Headers: Content-Type: application/json, Authorization: Bearer {token}
        - Body: JSON stringified request body
        - Timeout: 30 seconds using AbortSignal.timeout(30000)
      - Handle response:
        - If 401, show session expired error and redirect to login after 2 seconds
        - If not ok, throw error
        - Parse JSON response and return reply field
      - Handle errors with try-catch (see error handling task)
    - _Requirements: 8.1-8.10, 9.5_
  
  - [ ] 8.2 Implement AI response handling
    - After successful `callAIAPI()` response:
      - Create assistant message object: {role: "assistant", content: reply, timestamp: new Date().toISOString()}
      - Add assistant message to currentConversation.messages
      - Update currentConversation.updatedAt to now
      - Save conversation to localStorage
      - Render messages (shows AI response)
      - Update conversation list (updates timestamp)
    - _Requirements: 4.7-4.11_
  
  - [ ] 8.3 Implement comprehensive error handling
    - In `callAIAPI()` catch block, handle different error types:
      - AbortError (timeout): Show "The AI is taking longer than expected. Please try again."
      - Failed to fetch (network): Show "Network error. Please check your connection and try again."
      - 401 Unauthorized: Show "Session expired. Please log in again." and redirect
      - Other errors: Show "Unable to reach AI service. Please try again."
    - Implement `showError(message)` function:
      - Create error message element with warning icon, message text, and retry button
      - Insert into messages container
      - Attach retry button click handler that calls `sendMessage()` again
    - Implement `clearErrors()` function to remove error messages before new requests
    - _Requirements: 12.1-12.8_
  
  - [ ] 8.4 Implement storage error handling
    - Wrap `saveConversation()` calls in try-catch
    - Handle QuotaExceededError specifically:
      - Show error: "Storage limit reached. Please delete old conversations."
      - Provide option to delete oldest conversations
    - Log other storage errors to console
    - _Requirements: 12.8_

- [ ] 9. Checkpoint - Integration Testing
  - Test complete user flow: dashboard → floating button → AI page
  - Test new conversation creation and first message
  - Test AI response display with structured format
  - Test conversation persistence (reload page, verify conversations saved)
  - Test conversation switching (load previous conversation)
  - Test error scenarios (network error, invalid token, timeout)
  - Test responsive design on mobile and desktop
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Final Polish and Edge Cases
  - [ ] 10.1 Implement HTML escaping for user messages
    - Implement `escapeHtml(str)` helper function:
      - Replace &, <, >, " with HTML entities
      - Use when rendering user message content to prevent XSS
    - _Requirements: 15.5_
  
  - [ ] 10.2 Implement markdown-style formatting for AI responses
    - Implement `formatAIResponse(content)` function:
      - Replace **text** with `<strong>text</strong>` for section headers
      - Replace newlines with `<br>` for proper line breaks
      - Preserve structure of Priority Order, Start With, Today's Mini Plan, Support Note sections
    - Use when rendering assistant message content
    - _Requirements: 10.3-10.7, 11.9_
  
  - [ ] 10.3 Add input validation and character counter
    - Add character counter below textarea showing "X / 2000 characters"
    - Update counter on input event
    - Show warning style when approaching limit (> 1900 characters)
    - Prevent sending if over 2000 characters
    - _Requirements: 4.1-4.12_
  
  - [ ] 10.4 Implement conversation deletion (optional enhancement)
    - Add delete button (trash icon) to each conversation item (visible on hover)
    - Implement `deleteConversation(conversationId)` function:
      - Remove conversation from conversations array
      - Save updated array to localStorage
      - If deleted conversation was active, create new conversation
      - Re-render conversation list
    - Add confirmation dialog before deletion
    - _Requirements: 5.4-5.5_
  
  - [ ] 10.5 Add accessibility improvements
    - Add ARIA labels to buttons and interactive elements
    - Add role="log" to messages container for screen readers
    - Add aria-live="polite" to loading indicator
    - Ensure keyboard navigation works for all interactive elements
    - Add focus visible styles for keyboard users
    - _Requirements: 13.8-13.9_
  
  - [ ] 10.6 Add empty state for new conversation
    - Ensure welcome message displays correctly for new conversations
    - Include example prompts in welcome message:
      - "I have 3 assignments due this week and I'm feeling overwhelmed"
      - "Help me prioritize my tasks for today"
      - "I don't know where to start with my project"
    - Style example prompts as clickable suggestions (optional)
    - _Requirements: 18.4-18.7_

- [ ] 11. Final Checkpoint - Complete Feature Validation
  - Perform complete end-to-end testing of all features
  - Verify all requirements are met (cross-reference with requirements.md)
  - Test on multiple browsers (Chrome, Firefox, Safari, Edge)
  - Test on multiple devices (desktop, tablet, mobile)
  - Verify security measures (API key not exposed, JWT required, input sanitized)
  - Verify error handling for all error scenarios
  - Verify design consistency with StudyBalance design system
  - Verify conversation persistence and 50-conversation limit
  - Verify AI responses follow structured format
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

### Implementation Order Rationale

The tasks are ordered to enable incremental progress and early validation:

1. **Backend First (Tasks 1-2)**: Build and test the API endpoint independently before frontend work. This allows testing with Postman/curl and ensures the AI integration works correctly.

2. **Frontend Structure (Tasks 3-5)**: Create HTML and CSS before JavaScript logic. This allows visual validation of the layout and design consistency.

3. **Conversation Management (Task 6)**: Implement localStorage operations and conversation data structures before chat interface. This provides the foundation for message persistence.

4. **Chat Interface (Task 7)**: Implement message rendering and input handling using the conversation management foundation.

5. **Integration (Tasks 8-9)**: Connect frontend to backend and add comprehensive error handling. This is where the complete feature comes together.

6. **Polish (Tasks 10-11)**: Add edge case handling, accessibility improvements, and final validation.

### Key Technical Decisions

- **No Frameworks**: Uses vanilla JavaScript to match existing StudyBalance codebase
- **localStorage First**: Implements client-side storage with structure ready for database migration
- **Backend Security**: API key stored in .env, never exposed to frontend
- **Context Window**: Sends last 10 messages to AI for context-aware responses
- **Structured Responses**: AI follows consistent format (Priority Order, Start With, Today's Mini Plan, Support Note)
- **Error Handling**: Comprehensive error handling at each layer (network, API, timeout, auth, validation, storage)

### Testing Strategy

Manual testing is used throughout with checkpoints after major phases:
- **Checkpoint 1 (Task 2)**: Backend API testing with Postman/curl
- **Checkpoint 2 (Task 5)**: Frontend structure and styling validation
- **Checkpoint 3 (Task 9)**: Complete integration testing
- **Checkpoint 4 (Task 11)**: Final end-to-end validation

No automated tests or property-based tests are included because:
- Design document states PBT is not applicable (UI-heavy, external service, non-deterministic)
- Feature is primarily UI/UX focused
- Manual testing covers all functional requirements

### Requirements Coverage

Each task explicitly references the requirements it implements (e.g., "_Requirements: 1.1-1.8_"). This ensures:
- All 20 requirements are covered by implementation tasks
- Traceability from requirements to implementation
- Easy verification during testing checkpoints

### Future Enhancements

The implementation is structured to support future enhancements:
- **Database Migration**: localStorage structure matches planned database schema
- **Conversation Sync**: Data structure supports multi-device sync
- **Advanced Features**: Conversation search, export, sharing
- **Analytics**: Track conversation metrics, AI response quality

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["1.4"] },
    { "id": 3, "tasks": ["1.5"] },
    { "id": 4, "tasks": ["3.1"] },
    { "id": 5, "tasks": ["3.2", "3.3", "3.4", "3.5"] },
    { "id": 6, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 7, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 8, "tasks": ["6.5", "6.6"] },
    { "id": 9, "tasks": ["7.1", "7.2"] },
    { "id": 10, "tasks": ["7.3", "7.4", "7.5"] },
    { "id": 11, "tasks": ["8.1"] },
    { "id": 12, "tasks": ["8.2", "8.3", "8.4"] },
    { "id": 13, "tasks": ["10.1", "10.2", "10.3", "10.4", "10.5", "10.6"] }
  ]
}
```

### Dependency Graph Explanation

**Wave 0** (Setup): Install dependencies and configure environment - can run in parallel

**Wave 1** (Backend Core): Create AI chat route with Gemini integration - depends on Wave 0

**Wave 2** (Backend Endpoint): Implement POST endpoint with validation - depends on Wave 1

**Wave 3** (Backend Registration): Register route in server.js - depends on Wave 2

**Wave 4** (Frontend Base): Create HTML file - independent of backend

**Wave 5** (Frontend Structure): Build HTML structure for all panels - depends on Wave 4

**Wave 6** (Frontend Styling): Add CSS for all components - depends on Wave 5 (all write to style.css)

**Wave 7** (JS Foundation): Create JS file and implement core helpers - depends on Wave 4

**Wave 8** (Conversation Management): Implement conversation creation and rendering - depends on Wave 7

**Wave 9** (Message Display): Implement message rendering and input handling - depends on Wave 8

**Wave 10** (Chat Logic): Implement send message and conversation loading - depends on Wave 9

**Wave 11** (API Integration): Implement API call function - depends on Wave 10 and Wave 3

**Wave 12** (Error Handling): Implement response handling and error handling - depends on Wave 11

**Wave 13** (Polish): All final polish tasks can run in parallel - depends on Wave 12

**Note**: Checkpoint tasks (2, 5, 9, 11) are not included in the dependency graph as they are manual validation steps, not implementation tasks.
