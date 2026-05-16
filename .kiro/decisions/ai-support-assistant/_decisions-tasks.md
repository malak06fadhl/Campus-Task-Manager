# Task Implementation Decisions: AI Support Assistant

## Overview

This document outlines the key decisions for breaking down the AI Support Assistant feature into actionable implementation tasks. The feature adds conversational AI support to StudyBalance, allowing students to get help organizing their academic workload through natural language interaction.

---

## 1. Implementation Language

**Decision**: JavaScript (vanilla JS, following existing StudyBalance patterns)

**Rationale**:
- The design document uses **pseudocode** (not a specific programming language)
- The existing StudyBalance codebase uses:
  - **Backend**: Node.js with Express.js
  - **Frontend**: Vanilla JavaScript (no frameworks like React/Vue)
  - **Database**: SQLite
- Consistency with existing codebase is critical for maintainability
- The team is already familiar with this stack

**Confirmation Needed**: ✅ Confirmed - JavaScript matches the existing project

---

## 2. Task Breakdown Strategy

**Decision**: Break down into 6 major phases with sub-tasks

**Phases**:
1. **Backend Setup** - Gemini API integration and endpoint creation
2. **Frontend Structure** - HTML page and CSS styling
3. **Conversation Management** - localStorage operations and data models
4. **Chat Interface** - Message display and input handling
5. **Integration & Error Handling** - Connect frontend to backend, handle errors
6. **Testing & Polish** - Manual testing and final adjustments

**Rationale**:
- Follows the natural dependency order (backend → frontend → integration)
- Each phase delivers testable functionality
- Allows for incremental progress and validation
- Matches the design document's component structure

---

## 3. Testing Approach

**Decision**: Manual testing only (no property-based tests, no automated unit tests)

**Rationale**:
- The design document explicitly states: "Property-based testing (PBT) is **NOT applicable** for this feature"
- Reasons from design:
  - UI-heavy feature (conversation management, message display)
  - External service integration (Gemini API is non-deterministic)
  - Side effects (localStorage, API calls, DOM updates)
  - Limited pure functions
- Manual testing checklist provided in design document covers:
  - UI/UX validation
  - Responsive design
  - Functionality testing
  - Error handling
  - Security testing
  - Performance testing

**Testing Tasks**:
- Include manual testing checkpoints after major phases
- No separate test file creation tasks
- Focus on functional validation through user flows

---

## 4. File Organization

**Decision**: Follow existing StudyBalance file structure

**New Files to Create**:

**Frontend**:
- `html/ai-assistant.html` - Main AI assistant page
- `js/ai-assistant.js` - AI assistant JavaScript logic
- `css/style.css` - Add AI-specific styles (append to existing file)

**Backend**:
- `backend/routes/ai-chat.js` - New route for AI chat endpoint
- `backend/.env` - Add GEMINI_API_KEY (if not exists)

**Modifications**:
- `html/dashboard.html` - Add floating AI button
- `backend/server.js` - Register new AI chat route

**Rationale**:
- Matches existing project structure
- Minimal disruption to existing code
- Clear separation of concerns

---

## 5. Dependency Management

**Decision**: Add Gemini API SDK as new dependency

**New Dependencies**:
- `@google/generative-ai` - Official Gemini API SDK for Node.js

**Installation Command**:
```bash
npm install @google/generative-ai --save
```

**Rationale**:
- Official SDK provides type safety and error handling
- Simplifies API integration
- Handles authentication and request formatting
- Maintained by Google

---

## 6. Implementation Order

**Decision**: Backend-first approach

**Order**:
1. Backend API endpoint (can be tested with Postman/curl)
2. Frontend HTML structure (can be viewed without functionality)
3. Frontend JavaScript logic (connects to backend)
4. Integration and error handling
5. Testing and polish

**Rationale**:
- Backend can be tested independently
- Frontend depends on backend API
- Allows parallel work if multiple developers
- Reduces integration issues

---

## 7. localStorage vs Database

**Decision**: Use localStorage for MVP (as specified in design)

**Rationale**:
- Design document specifies localStorage for initial implementation
- Structured for future database migration
- Simpler implementation for MVP
- No database schema changes required
- 50-conversation limit prevents storage issues

**Future Migration Path**:
- Database schema already designed in design document
- Data structure compatible with future migration
- Migration can be done in a separate phase

---

## 8. Error Handling Strategy

**Decision**: Comprehensive error handling at each layer

**Error Categories** (from design):
1. Network errors (no connection)
2. API errors (backend failures)
3. Timeout errors (30-second limit)
4. Authentication errors (invalid JWT)
5. Validation errors (empty/long messages)
6. Storage errors (localStorage full)

**Implementation**:
- Frontend: Display user-friendly error messages with retry option
- Backend: Return structured error responses with appropriate status codes
- Logging: Console errors for debugging (no sensitive data)

---

## 9. Security Considerations

**Decision**: Multi-layer security approach

**Security Measures**:
1. **API Key Protection**: Store in .env, never expose to frontend
2. **Authentication**: JWT required for all AI chat requests
3. **Input Validation**: Sanitize user input, enforce character limits
4. **Error Messages**: Generic messages (don't expose internal details)
5. **CORS**: Use existing CORS configuration

**Rationale**:
- Follows existing StudyBalance security patterns
- Protects sensitive API keys
- Prevents common vulnerabilities (XSS, injection)

---

## 10. Responsive Design Approach

**Decision**: Mobile-first CSS with breakpoints

**Breakpoints**:
- Mobile: < 768px (stacked layout)
- Tablet/Desktop: ≥ 768px (side-by-side layout)

**Key Responsive Features**:
- Floating button: Always visible, properly positioned
- Conversation list: Collapsible on mobile
- Message input: Adapts to mobile keyboards
- Touch targets: Minimum 44x44 pixels

**Rationale**:
- Matches existing StudyBalance responsive patterns
- Covers all device sizes (320px to 2560px)
- Maintains usability on all devices

---

## 11. System Prompt Configuration

**Decision**: Hardcode system prompt in backend (with comment for future configuration)

**System Prompt** (from requirements):
```
You are an academic workload organizer for students. Your role is to help students organize their thoughts about academic tasks, prioritize their workload based on urgency and importance, suggest actionable first steps, and provide calming, supportive guidance. Always respond in this structure: Priority Order: [list priorities], Start With: [first action], Today's Mini Plan: [2-3 actionable steps], Support Note: [encouraging message]. Use previous conversation context to provide continuity.
```

**Rationale**:
- Simple implementation for MVP
- Easy to modify during development
- Can be moved to environment variable later
- Ensures consistent AI behavior

---

## 12. Context Window Management

**Decision**: Send last 10 messages to Gemini API

**Implementation**:
- Frontend: Extract last 10 messages before sending
- Backend: Validate message count (prevent abuse)
- Format: Array of {role, content} objects

**Rationale**:
- Balances context quality with API costs
- Prevents token limit issues
- Specified in design document
- Sufficient for meaningful conversations

---

## 13. Conversation Title Generation

**Decision**: Client-side title generation from first message

**Algorithm**:
1. Take first user message content
2. Trim whitespace
3. Truncate to 50 characters
4. Add "..." if truncated
5. Fallback to "New Conversation" if empty

**Rationale**:
- No backend processing needed
- Immediate feedback to user
- Simple and predictable
- Matches design specification

---

## 14. Loading States

**Decision**: Animated loading indicator with text

**Design**:
- Three pulsing dots animation
- "AI is thinking..." text
- Positioned below last message
- Styled consistently with design system

**Rationale**:
- Provides clear feedback during AI processing
- Reduces perceived wait time
- Matches modern chat UX patterns

---

## 15. Checkpoint Strategy

**Decision**: Include checkpoints after major phases

**Checkpoint Format**:
```
- [ ] X. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
```

**Checkpoints After**:
1. Backend implementation
2. Frontend structure
3. Integration complete
4. Final testing

**Rationale**:
- Allows user to verify progress
- Catches issues early
- Provides natural break points
- Follows workflow requirements

---

## 16. Optional Tasks

**Decision**: No optional tasks (no property-based tests)

**Rationale**:
- Design document states PBT is not applicable
- All implementation tasks are required for MVP
- Testing is manual, not automated
- No test sub-tasks to mark as optional

---

## 17. Task Dependency Management

**Decision**: Sequential implementation with clear dependencies

**Dependency Rules**:
1. Backend must be complete before frontend integration
2. HTML structure before JavaScript logic
3. Conversation management before chat interface
4. Core functionality before error handling
5. All features before final testing

**Rationale**:
- Prevents integration issues
- Enables incremental testing
- Clear task ordering
- Reduces rework

---

## 18. Environment Configuration

**Decision**: Use .env file for API key (existing pattern)

**Required Environment Variables**:
```
GEMINI_API_KEY=your_api_key_here
```

**Setup Task**:
- Include task to create/update .env file
- Add .env to .gitignore (if not already)
- Document in README (separate task)

**Rationale**:
- Follows existing StudyBalance pattern
- Keeps secrets out of code
- Easy to configure per environment

---

## 19. UUID Generation

**Decision**: Use existing UUID helper function pattern

**Implementation**:
- Copy UUID generation function from existing routes (e.g., tasks.js)
- Use for conversation IDs
- Client-side generation (no backend dependency)

**Rationale**:
- Consistent with existing codebase
- No new dependencies needed
- Proven to work in production

---

## 20. Timestamp Formatting

**Decision**: Implement relative time formatting (e.g., "2 hours ago")

**Format Rules**:
- < 1 hour: "X minutes ago"
- < 24 hours: "X hours ago"
- Yesterday: "Yesterday"
- Older: "MMM DD, YYYY"

**Rationale**:
- Improves UX (more readable than ISO timestamps)
- Matches modern chat applications
- Specified in design document

---

## Summary

These decisions provide a clear roadmap for implementing the AI Support Assistant feature:

✅ **Language**: JavaScript (vanilla JS, Node.js backend)
✅ **Testing**: Manual testing only (no PBT, no automated tests)
✅ **Structure**: 6 major phases with clear dependencies
✅ **Storage**: localStorage for MVP (database-ready structure)
✅ **Security**: Multi-layer approach (JWT, API key protection, input validation)
✅ **Responsive**: Mobile-first with 768px breakpoint
✅ **Dependencies**: Add @google/generative-ai SDK
✅ **Implementation Order**: Backend-first approach

**Next Steps**:
1. Review and approve these decisions
2. Generate detailed task list (tasks.md)
3. Begin implementation starting with backend

---

## Questions for Review

Before proceeding to task generation, please confirm:

1. ✅ **Language Choice**: JavaScript (vanilla JS) is correct for this project
2. ✅ **Testing Approach**: Manual testing only (no automated tests) is acceptable
3. ✅ **Storage Strategy**: localStorage for MVP is acceptable (database migration later)
4. ✅ **Implementation Order**: Backend-first approach works for your workflow
5. ✅ **Dependency Addition**: Adding @google/generative-ai SDK is approved

**Please review these decisions and let me know if any changes are needed before I generate the task list.**
