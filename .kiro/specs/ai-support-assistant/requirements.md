# Requirements Document: AI Support Assistant

## Introduction

The AI Support Assistant is a conversational interface integrated into the StudyBalance application that helps students organize their academic workload, prioritize tasks, and manage stress through natural language interaction. The assistant provides structured guidance focused on task organization and action planning, with conversation persistence to maintain context across sessions.

## Glossary

- **AI_Assistant**: The conversational AI system that provides academic workload organization guidance to students
- **Student**: An authenticated user with the "student" role who can access the AI Assistant
- **Conversation**: A persistent chat session containing a sequence of messages between the Student and the AI_Assistant
- **Message**: A single communication unit within a Conversation, containing role (user or assistant), content, and timestamp
- **Conversation_Title**: An auto-generated text label (maximum 50 characters) derived from the first user message in a Conversation
- **Floating_Button**: A fixed-position circular UI element on the dashboard that provides access to the AI Assistant
- **AI_Page**: The dedicated interface (ai-assistant.html) containing the conversation list and active chat area
- **Backend_Endpoint**: The server-side API route (/api/ai-chat) that securely processes AI requests
- **AI_Provider**: The external AI service (Gemini API) used to generate assistant responses
- **Context_Window**: The last 10 messages from a Conversation sent to the AI_Provider for context-aware responses
- **Conversation_Storage**: The localStorage-based persistence mechanism for saving conversations (structured for future database migration)
- **Structured_Response**: The formatted AI output containing Priority Order, Start With, Today's Mini Plan, and Support Note sections
- **System_Prompt**: The instruction set that defines the AI_Assistant's behavior and response format

## Requirements

### Requirement 1: Floating Button Access

**User Story:** As a Student, I want to access the AI Assistant from the dashboard with a single click, so that I can quickly get help when feeling overwhelmed.

#### Acceptance Criteria

1. THE Floating_Button SHALL be displayed at the bottom-right corner of the dashboard page
2. THE Floating_Button SHALL have a circular shape with a minimum diameter of 56 pixels
3. THE Floating_Button SHALL use the StudyBalance blue color theme (--blue: #2f6fe4)
4. THE Floating_Button SHALL display an AI icon or "AI" text label
5. THE Floating_Button SHALL remain fixed in position during page scrolling
6. WHEN a Student clicks the Floating_Button, THE System SHALL navigate to the AI_Page
7. THE Floating_Button SHALL have a hover effect consistent with the StudyBalance design system
8. THE Floating_Button SHALL be visible only to authenticated Students

### Requirement 2: AI Assistant Page Layout

**User Story:** As a Student, I want a dedicated AI assistant interface with clear conversation management, so that I can easily start new chats and access previous conversations.

#### Acceptance Criteria

1. THE AI_Page SHALL include the standard StudyBalance sidebar navigation
2. THE AI_Page SHALL include the standard StudyBalance topbar
3. THE AI_Page SHALL display "AI Study Support" as the page title
4. THE AI_Page SHALL contain a two-panel layout with a conversation list panel and an active chat panel
5. THE conversation list panel SHALL be positioned on the left side with a width of 280 pixels
6. THE active chat panel SHALL occupy the remaining horizontal space
7. THE AI_Page SHALL include a "New Chat" button at the top of the conversation list panel
8. THE AI_Page SHALL include a message input area at the bottom of the active chat panel
9. THE AI_Page SHALL include a send button adjacent to the message input area
10. THE AI_Page SHALL be responsive on desktop, laptop, tablet, and mobile devices
11. WHEN viewed on mobile devices, THE System SHALL stack the conversation list above the active chat panel

### Requirement 3: Start New Conversation

**User Story:** As a Student, I want to start a new conversation with the AI Assistant, so that I can ask questions about my academic workload.

#### Acceptance Criteria

1. WHEN a Student clicks the "New Chat" button, THE System SHALL create a new empty Conversation
2. THE System SHALL generate a unique identifier for the new Conversation
3. THE System SHALL set the Conversation creation timestamp to the current time
4. THE System SHALL display the empty Conversation in the active chat panel
5. THE System SHALL clear any previously displayed messages from the active chat panel
6. THE System SHALL focus the message input area
7. THE System SHALL NOT generate a Conversation_Title until the first user message is sent

### Requirement 4: Send Message to AI Assistant

**User Story:** As a Student, I want to send messages to the AI Assistant, so that I can describe my academic stress and workload concerns.

#### Acceptance Criteria

1. WHEN a Student types text into the message input area and clicks the send button, THE System SHALL create a new Message with role "user"
2. THE System SHALL add the user Message to the current Conversation
3. THE System SHALL display the user Message in the active chat panel
4. THE System SHALL clear the message input area
5. THE System SHALL display a loading indicator while waiting for the AI response
6. THE System SHALL send the Conversation messages to the Backend_Endpoint
7. WHEN the Backend_Endpoint returns a response, THE System SHALL create a new Message with role "assistant"
8. THE System SHALL add the assistant Message to the current Conversation
9. THE System SHALL display the assistant Message in the active chat panel
10. THE System SHALL remove the loading indicator
11. THE System SHALL auto-scroll the active chat panel to show the latest message
12. IF the message is the first in the Conversation, THE System SHALL generate a Conversation_Title from the message content (maximum 50 characters)

### Requirement 5: Conversation Persistence

**User Story:** As a Student, I want my conversations to be saved automatically, so that I can return to them later without losing context.

#### Acceptance Criteria

1. WHEN a new Message is added to a Conversation, THE System SHALL save the Conversation to Conversation_Storage
2. THE System SHALL update the Conversation's updatedAt timestamp to the current time
3. THE System SHALL store the Conversation in JSON format with id, title, createdAt, updatedAt, and messages fields
4. THE System SHALL maintain a maximum of 50 saved Conversations per Student
5. WHEN the 50-conversation limit is reached, THE System SHALL remove the oldest Conversation by updatedAt timestamp
6. WHEN the AI_Page loads, THE System SHALL retrieve all saved Conversations from Conversation_Storage
7. THE System SHALL display the Conversations in the conversation list panel sorted by most recent updatedAt timestamp

### Requirement 6: Conversation List Display

**User Story:** As a Student, I want to see a list of my previous conversations, so that I can find and continue past discussions.

#### Acceptance Criteria

1. THE conversation list panel SHALL display all saved Conversations
2. FOR EACH Conversation, THE System SHALL display the Conversation_Title
3. FOR EACH Conversation, THE System SHALL display the updatedAt timestamp in a human-readable format (e.g., "2 hours ago", "Yesterday")
4. THE Conversations SHALL be sorted by most recent updatedAt timestamp (newest first)
5. THE System SHALL highlight the currently active Conversation in the list
6. WHEN the conversation list is empty, THE System SHALL display an empty state message "No conversations yet. Start a new chat!"
7. THE conversation list panel SHALL be scrollable when the number of Conversations exceeds the visible area

### Requirement 7: Continue Existing Conversation

**User Story:** As a Student, I want to click on a previous conversation and continue it, so that the AI Assistant remembers our earlier discussion.

#### Acceptance Criteria

1. WHEN a Student clicks a Conversation in the conversation list panel, THE System SHALL load the Conversation into the active chat panel
2. THE System SHALL display all Messages from the Conversation in chronological order
3. THE System SHALL set the clicked Conversation as the active Conversation
4. THE System SHALL highlight the active Conversation in the conversation list panel
5. THE System SHALL enable the message input area for the active Conversation
6. WHEN a Student sends a new Message in the active Conversation, THE System SHALL include the Context_Window in the request to the Backend_Endpoint
7. THE Context_Window SHALL contain the last 10 Messages from the Conversation

### Requirement 8: Backend AI Integration Endpoint

**User Story:** As a system administrator, I want a secure backend endpoint for AI requests, so that API keys are never exposed to the frontend.

#### Acceptance Criteria

1. THE Backend_Endpoint SHALL be accessible at POST /api/ai-chat
2. THE Backend_Endpoint SHALL require authentication via JWT token
3. THE Backend_Endpoint SHALL accept a JSON request body with conversationId and messages fields
4. THE messages field SHALL be an array of objects with role and content properties
5. THE Backend_Endpoint SHALL validate that the messages array is not empty
6. THE Backend_Endpoint SHALL send the messages to the AI_Provider with the System_Prompt
7. THE Backend_Endpoint SHALL receive the response from the AI_Provider
8. THE Backend_Endpoint SHALL return a JSON response with a reply field containing the AI response text
9. IF the AI_Provider request fails, THE Backend_Endpoint SHALL return an error response with status code 500
10. THE Backend_Endpoint SHALL NOT log or store API keys in application logs

### Requirement 9: AI Provider Integration

**User Story:** As a system administrator, I want to integrate with the Gemini API, so that the AI Assistant can generate intelligent responses.

#### Acceptance Criteria

1. THE System SHALL use the Gemini API as the AI_Provider
2. THE System SHALL read the Gemini API key from the environment variable GEMINI_API_KEY
3. THE System SHALL include the System_Prompt in every request to the AI_Provider
4. THE System SHALL send the Context_Window messages as conversation history to the AI_Provider
5. THE System SHALL set a timeout of 30 seconds for AI_Provider requests
6. IF the AI_Provider request times out, THE System SHALL return an error message to the Student
7. IF the AI_Provider returns an error, THE System SHALL log the error and return a user-friendly error message

### Requirement 10: AI Assistant Behavior and Response Format

**User Story:** As a Student, I want the AI Assistant to provide structured, actionable guidance focused on academic workload organization, so that I receive clear next steps rather than generic advice.

#### Acceptance Criteria

1. THE System_Prompt SHALL define the AI_Assistant as an academic workload organizer
2. THE System_Prompt SHALL instruct the AI_Assistant to focus on organizing thoughts, prioritizing tasks, suggesting first steps, and providing calming guidance
3. THE System_Prompt SHALL instruct the AI_Assistant to respond in a Structured_Response format
4. THE Structured_Response SHALL contain a "Priority Order" section listing priorities
5. THE Structured_Response SHALL contain a "Start With" section describing the first action
6. THE Structured_Response SHALL contain a "Today's Mini Plan" section with 2-3 actionable steps
7. THE Structured_Response SHALL contain a "Support Note" section with an encouraging message
8. THE AI_Assistant SHALL use previous Messages in the Context_Window to provide context-aware responses
9. THE AI_Assistant SHALL NOT create, modify, or delete tasks in the StudyBalance database
10. THE AI_Assistant SHALL maintain a supportive and calming tone in all responses

### Requirement 11: Message Display Formatting

**User Story:** As a Student, I want to clearly distinguish between my messages and the AI Assistant's responses, so that I can easily follow the conversation flow.

#### Acceptance Criteria

1. THE System SHALL display user Messages with a distinct visual style from assistant Messages
2. User Messages SHALL be aligned to the right side of the active chat panel
3. Assistant Messages SHALL be aligned to the left side of the active chat panel
4. User Messages SHALL use a blue background color consistent with the StudyBalance theme
5. Assistant Messages SHALL use a light gray background color
6. THE System SHALL display a timestamp for each Message in a small, muted font
7. THE System SHALL display Messages in chronological order from top to bottom
8. THE System SHALL apply appropriate spacing between consecutive Messages
9. THE System SHALL format the Structured_Response sections with clear visual hierarchy (bold section headers)

### Requirement 12: Error Handling and User Feedback

**User Story:** As a Student, I want clear feedback when something goes wrong, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. WHEN the Backend_Endpoint returns an error, THE System SHALL display an error message in the active chat panel
2. THE error message SHALL be styled distinctly from regular Messages (red border or icon)
3. THE error message SHALL provide actionable guidance (e.g., "Unable to reach AI service. Please try again.")
4. WHEN a network error occurs, THE System SHALL display "Network error. Please check your connection and try again."
5. WHEN the AI_Provider times out, THE System SHALL display "The AI is taking longer than expected. Please try again."
6. THE System SHALL remove the loading indicator when an error occurs
7. THE System SHALL allow the Student to retry sending the message after an error
8. WHEN Conversation_Storage quota is exceeded, THE System SHALL display "Storage limit reached. Please delete old conversations."

### Requirement 13: Responsive Design and Accessibility

**User Story:** As a Student using a mobile device, I want the AI Assistant to work seamlessly on my phone, so that I can get help anywhere.

#### Acceptance Criteria

1. THE AI_Page SHALL be fully functional on devices with screen widths from 320 pixels to 2560 pixels
2. WHEN the screen width is less than 768 pixels, THE System SHALL stack the conversation list panel above the active chat panel
3. WHEN the screen width is less than 768 pixels, THE System SHALL collapse the conversation list by default with a toggle button
4. THE Floating_Button SHALL remain accessible and properly positioned on all screen sizes
5. THE message input area SHALL resize appropriately on mobile keyboards
6. THE System SHALL use touch-friendly button sizes (minimum 44x44 pixels) on mobile devices
7. THE AI_Page SHALL maintain the StudyBalance design system consistency across all screen sizes
8. THE System SHALL support keyboard navigation for the message input area and send button
9. THE send button SHALL be activatable via Enter key when the message input area is focused

### Requirement 14: Conversation Title Generation

**User Story:** As a Student, I want my conversations to have meaningful titles, so that I can quickly identify them in the conversation list.

#### Acceptance Criteria

1. WHEN the first user Message is sent in a Conversation, THE System SHALL generate a Conversation_Title
2. THE System SHALL extract the first 50 characters from the user Message content
3. IF the user Message is longer than 50 characters, THE System SHALL truncate at 50 characters and append "..."
4. IF the user Message is shorter than 50 characters, THE System SHALL use the entire message as the Conversation_Title
5. THE System SHALL remove leading and trailing whitespace from the Conversation_Title
6. THE System SHALL update the Conversation in Conversation_Storage with the generated Conversation_Title
7. THE System SHALL display the Conversation_Title in the conversation list panel

### Requirement 15: Security and Authentication

**User Story:** As a system administrator, I want to ensure that only authenticated students can access the AI Assistant, so that the system remains secure.

#### Acceptance Criteria

1. THE AI_Page SHALL require authentication before displaying content
2. WHEN an unauthenticated user attempts to access the AI_Page, THE System SHALL redirect to the login page
3. THE Backend_Endpoint SHALL validate the JWT token in the Authorization header
4. IF the JWT token is missing or invalid, THE Backend_Endpoint SHALL return status code 401 Unauthorized
5. THE System SHALL store Conversations in Conversation_Storage scoped to the authenticated Student's user ID
6. THE System SHALL NOT allow Students to access Conversations belonging to other Students
7. THE Gemini API key SHALL be stored in the .env file and never exposed in frontend code
8. THE Backend_Endpoint SHALL NOT include the API key in any response to the frontend

### Requirement 16: Design System Consistency

**User Story:** As a Student, I want the AI Assistant interface to match the rest of StudyBalance, so that the experience feels cohesive.

#### Acceptance Criteria

1. THE AI_Page SHALL use the StudyBalance color palette defined in style.css CSS custom properties
2. THE AI_Page SHALL use --blue (#2f6fe4) for primary interactive elements
3. THE AI_Page SHALL use --bg (#f4f6fb) for the page background
4. THE AI_Page SHALL use --card (#ffffff) for conversation list items and message bubbles
5. THE AI_Page SHALL use --radius (16px) for card border radius
6. THE AI_Page SHALL use --shadow for card box shadows
7. THE AI_Page SHALL use the same typography scale as other StudyBalance pages
8. THE Floating_Button SHALL use the same button styles as other primary buttons in the design system
9. THE AI_Page SHALL use the same sidebar and topbar components as other student pages
10. THE AI_Page SHALL maintain consistent spacing using the --s1, --s2, --s3, --s4 spacing variables

### Requirement 17: Loading States and User Feedback

**User Story:** As a Student, I want to see clear indicators when the AI is processing my message, so that I know the system is working.

#### Acceptance Criteria

1. WHEN a Student sends a Message, THE System SHALL display a loading indicator in the active chat panel
2. THE loading indicator SHALL be positioned below the last Message
3. THE loading indicator SHALL use an animated element (e.g., pulsing dots or spinner)
4. THE loading indicator SHALL be styled consistently with the StudyBalance design system
5. THE System SHALL disable the send button while a request is in progress
6. THE System SHALL disable the message input area while a request is in progress
7. WHEN the AI response is received, THE System SHALL remove the loading indicator
8. WHEN the AI response is received, THE System SHALL re-enable the send button and message input area

### Requirement 18: Empty States

**User Story:** As a Student using the AI Assistant for the first time, I want helpful guidance on how to get started, so that I understand what the assistant can do.

#### Acceptance Criteria

1. WHEN the conversation list panel is empty, THE System SHALL display an empty state message
2. THE empty state message SHALL read "No conversations yet. Start a new chat!"
3. THE empty state SHALL include an icon or illustration consistent with the StudyBalance design
4. WHEN the active chat panel is empty (new conversation), THE System SHALL display a welcome message
5. THE welcome message SHALL read "Hi! I'm your AI study support assistant. Tell me about your workload, and I'll help you organize and prioritize."
6. THE welcome message SHALL include example prompts (e.g., "I have 3 assignments due this week and I'm feeling overwhelmed")
7. THE welcome message SHALL be styled as an assistant Message but with a distinct visual treatment

### Requirement 19: Data Structure and Storage Format

**User Story:** As a developer, I want a well-structured data format for conversations, so that future database migration is straightforward.

#### Acceptance Criteria

1. THE Conversation_Storage SHALL use the key "ai_conversations" in localStorage
2. THE stored value SHALL be a JSON string containing an array of Conversation objects
3. EACH Conversation object SHALL have the following fields: id (string), title (string), createdAt (ISO 8601 timestamp), updatedAt (ISO 8601 timestamp), messages (array)
4. EACH Message object SHALL have the following fields: role (string: "user" or "assistant"), content (string), timestamp (ISO 8601 timestamp)
5. THE System SHALL validate the data structure when reading from Conversation_Storage
6. IF the data structure is invalid or corrupted, THE System SHALL initialize an empty conversations array
7. THE System SHALL use UUID v4 format for Conversation id values
8. THE System SHALL use ISO 8601 format for all timestamp values

### Requirement 20: System Prompt Definition

**User Story:** As a system administrator, I want a well-defined system prompt, so that the AI Assistant provides consistent, high-quality responses.

#### Acceptance Criteria

1. THE System_Prompt SHALL be defined in the backend code (not in frontend)
2. THE System_Prompt SHALL include the following instruction: "You are an academic workload organizer for students."
3. THE System_Prompt SHALL include the following instruction: "Your role is to help students organize their thoughts about academic tasks, prioritize their workload based on urgency and importance, suggest actionable first steps, and provide calming, supportive guidance."
4. THE System_Prompt SHALL include the following instruction: "Always respond in this structure: Priority Order: [list priorities], Start With: [first action], Today's Mini Plan: [2-3 actionable steps], Support Note: [encouraging message]."
5. THE System_Prompt SHALL include the following instruction: "Use previous conversation context to provide continuity."
6. THE System_Prompt SHALL be configurable via environment variable or configuration file for future adjustments
7. THE System SHALL send the System_Prompt as the first message in the conversation context to the AI_Provider

---

## Requirements Summary

This requirements document defines 20 functional requirements with 177 acceptance criteria for the AI Support Assistant feature. The feature provides students with a conversational AI interface for academic workload organization, with conversation persistence, structured responses, and seamless integration into the existing StudyBalance application.

**Key Capabilities:**
- Single-click access via floating button on dashboard
- Dedicated AI assistant page with conversation management
- Persistent conversations with auto-generated titles
- Context-aware AI responses using last 10 messages
- Structured response format (Priority Order, Start With, Today's Mini Plan, Support Note)
- Secure backend integration with Gemini API
- Responsive design for mobile and desktop
- Consistent with StudyBalance design system
- localStorage-based storage structured for future database migration

**Security Measures:**
- JWT authentication required for all access
- API keys stored securely in environment variables
- User-scoped conversation storage
- No cross-user conversation access

**Quality Attributes:**
- Responsive design (320px to 2560px screen widths)
- 30-second timeout for AI requests
- Maximum 50 saved conversations per user
- Context window of last 10 messages
- Conversation titles limited to 50 characters
