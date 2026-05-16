/* ============================================================
   StudyBalance — AI Assistant
   js/ai-assistant.js
   ============================================================ */

(function () {
  'use strict';

  /* ── Configuration ── */
  const API = 'http://localhost:3000/api';
  const STORAGE_KEY = 'ai_conversations';
  const MAX_CONVERSATIONS = 50;
  const MAX_MESSAGE_LENGTH = 2000;
  const CONTEXT_WINDOW_SIZE = 10;

  /* ── State ── */
  let currentConversation = null;
  let conversations = [];
  let isLoading = false;

  /* ── DOM Elements ── */
  let newChatBtn, conversationList, conversationEmptyState;
  let messagesContainer, welcomeMessage, messageInput, sendBtn;
  let characterCounter, charCount;

  /* ── Initialization ── */
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    /* Guard: ensure user is authenticated student */
    SB.guardStudent();

    /* Get DOM elements */
    newChatBtn = document.getElementById('newChatBtn');
    conversationList = document.getElementById('conversationList');
    conversationEmptyState = document.getElementById('conversationEmptyState');
    messagesContainer = document.getElementById('messagesContainer');
    welcomeMessage = document.getElementById('welcomeMessage');
    messageInput = document.getElementById('messageInput');
    sendBtn = document.getElementById('sendBtn');
    characterCounter = document.getElementById('characterCounter');
    charCount = document.getElementById('charCount');

    /* Load conversations from localStorage */
    conversations = loadConversations();

    /* Render conversation list */
    renderConversationList();

    /* If no conversations, create a new one */
    if (conversations.length === 0) {
      createNewConversation();
    } else {
      /* Load the most recent conversation */
      loadConversation(conversations[0].id);
    }

    /* Event listeners */
    newChatBtn.addEventListener('click', createNewConversation);
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('input', handleInputChange);
    messageInput.addEventListener('keydown', handleKeyDown);

    /* Update user info in topbar */
    SB.updateUserInfo();
  }

  /* ══════════════════════════════════════════════════════════
     localStorage Operations
     ══════════════════════════════════════════════════════════ */

  function loadConversations() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];

      /* Validate and filter conversations */
      const valid = parsed.filter(c =>
        c.id && c.title && c.createdAt && c.updatedAt && Array.isArray(c.messages)
      );

      /* Sort by most recent first */
      valid.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      return valid;
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  }

  function saveConversation(conversation) {
    try {
      const existing = loadConversations();
      const index = existing.findIndex(c => c.id === conversation.id);

      if (index >= 0) {
        existing[index] = conversation;
      } else {
        existing.unshift(conversation);
      }

      /* Enforce conversation limit */
      if (existing.length > MAX_CONVERSATIONS) {
        existing.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
        existing.shift(); /* Remove oldest */
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      conversations = loadConversations();
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        showError('Storage limit reached. Please delete old conversations.');
      } else {
        console.error('Failed to save conversation:', error);
      }
    }
  }

  function deleteConversation(conversationId) {
    /* Find the conversation to delete */
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    /* Show confirmation dialog */
    const confirmed = confirm(`Delete conversation "${conversation.title}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
      /* Remove from localStorage */
      const existing = loadConversations();
      const filtered = existing.filter(c => c.id !== conversationId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      conversations = loadConversations();

      /* If the deleted conversation was currently open, clear the chat */
      if (currentConversation && currentConversation.id === conversationId) {
        currentConversation = null;
        
        /* If there are other conversations, load the most recent one */
        if (conversations.length > 0) {
          loadConversation(conversations[0].id);
        } else {
          /* No conversations left, show welcome message */
          welcomeMessage.style.display = 'block';
          messagesContainer.innerHTML = '';
          messagesContainer.appendChild(welcomeMessage);
        }
      }

      /* Re-render the conversation list */
      renderConversationList();

    } catch (error) {
      console.error('Failed to delete conversation:', error);
      showError('Failed to delete conversation. Please try again.');
    }
  }

  /* ══════════════════════════════════════════════════════════
     Conversation Management
     ══════════════════════════════════════════════════════════ */

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function generateTitle(messageContent) {
    const trimmed = messageContent.trim();
    if (!trimmed) return 'New Conversation';
    if (trimmed.length <= 50) return trimmed;
    return trimmed.substring(0, 50) + '...';
  }

  function createNewConversation() {
    const conversation = {
      id: generateUUID(),
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };

    currentConversation = conversation;
    renderMessages();
    renderConversationList();
    messageInput.focus();
  }

  function loadConversation(conversationId) {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    currentConversation = conversation;
    renderMessages();
    renderConversationList();
    messageInput.focus();
  }

  /* ══════════════════════════════════════════════════════════
     UI Rendering
     ══════════════════════════════════════════════════════════ */

  function renderConversationList() {
    if (conversations.length === 0) {
      conversationList.style.display = 'none';
      conversationEmptyState.style.display = 'block';
      return;
    }

    conversationList.style.display = 'block';
    conversationEmptyState.style.display = 'none';

    conversationList.innerHTML = conversations.map(conv => {
      const isActive = currentConversation && conv.id === currentConversation.id;
      return `
        <div class="conversation-item ${isActive ? 'active' : ''}" data-id="${conv.id}">
          <div class="conversation-icon">📝</div>
          <div class="conversation-info">
            <div class="conversation-title">${escapeHtml(conv.title)}</div>
            <div class="conversation-time">${formatTimestamp(conv.updatedAt)}</div>
          </div>
          <button class="conversation-delete-btn" data-id="${conv.id}" title="Delete conversation">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');

    /* Attach click handlers for conversation items */
    conversationList.querySelectorAll('.conversation-item').forEach(item => {
      item.addEventListener('click', (e) => {
        /* Don't open conversation if delete button was clicked */
        if (e.target.closest('.conversation-delete-btn')) {
          return;
        }
        loadConversation(item.dataset.id);
      });
    });

    /* Attach click handlers for delete buttons */
    conversationList.querySelectorAll('.conversation-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); /* Prevent conversation from opening */
        const conversationId = btn.dataset.id;
        deleteConversation(conversationId);
      });
    });
  }

  function renderMessages() {
    if (!currentConversation || currentConversation.messages.length === 0) {
      welcomeMessage.style.display = 'block';
      messagesContainer.innerHTML = '';
      messagesContainer.appendChild(welcomeMessage);
      return;
    }

    welcomeMessage.style.display = 'none';
    messagesContainer.innerHTML = '';

    currentConversation.messages.forEach(msg => {
      const messageEl = createMessageElement(msg);
      messagesContainer.appendChild(messageEl);
    });

    /* Auto-scroll to bottom */
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `message ${message.role}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (message.role === 'user') {
      contentDiv.textContent = message.content;
    } else {
      contentDiv.innerHTML = formatAIResponse(message.content);
    }

    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'message-timestamp';
    timestampDiv.textContent = formatTimestamp(message.timestamp);

    div.appendChild(contentDiv);
    div.appendChild(timestampDiv);

    return div;
  }

  function showLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.id = 'loadingIndicator';
    loadingDiv.innerHTML = `
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span class="loading-text">AI is thinking...</span>
    `;
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function hideLoadingIndicator() {
    const loadingDiv = document.getElementById('loadingIndicator');
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }

  function showError(message, allowRetry = false) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <div class="error-title">Error</div>
        <div class="error-description">${escapeHtml(message)}</div>
      </div>
      ${allowRetry ? '<button class="retry-btn">Retry</button>' : ''}
    `;

    if (allowRetry) {
      const retryBtn = errorDiv.querySelector('.retry-btn');
      retryBtn.addEventListener('click', () => {
        errorDiv.remove();
        sendMessage();
      });
    }

    messagesContainer.appendChild(errorDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function clearErrors() {
    messagesContainer.querySelectorAll('.error-message').forEach(el => el.remove());
  }

  /* ══════════════════════════════════════════════════════════
     Message Handling
     ══════════════════════════════════════════════════════════ */

  function handleInputChange() {
    const length = messageInput.value.length;
    charCount.textContent = length;

    /* Update character counter styling */
    characterCounter.classList.remove('warning', 'error');
    if (length > 1900) {
      characterCounter.classList.add('warning');
    }
    if (length > MAX_MESSAGE_LENGTH) {
      characterCounter.classList.add('error');
    }

    /* Update send button state */
    updateSendButtonState();

    /* Auto-expand textarea */
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function updateSendButtonState() {
    const hasContent = messageInput.value.trim().length > 0;
    const withinLimit = messageInput.value.length <= MAX_MESSAGE_LENGTH;
    sendBtn.disabled = !hasContent || !withinLimit || isLoading;
  }

  async function sendMessage() {
    const content = messageInput.value.trim();

    /* Validation */
    if (!content) return;
    if (content.length > MAX_MESSAGE_LENGTH) {
      showError('Message is too long (max 2000 characters)');
      return;
    }

    /* If no current conversation, create one */
    if (!currentConversation) {
      createNewConversation();
    }

    /* Create user message */
    const userMessage = {
      role: 'user',
      content: content,
      timestamp: new Date().toISOString()
    };

    /* Add to conversation */
    currentConversation.messages.push(userMessage);

    /* Generate title from first message */
    if (currentConversation.messages.length === 1) {
      currentConversation.title = generateTitle(content);
    }

    /* Update conversation timestamp */
    currentConversation.updatedAt = new Date().toISOString();

    /* Save conversation */
    saveConversation(currentConversation);

    /* Clear input and update UI */
    messageInput.value = '';
    messageInput.style.height = 'auto';
    charCount.textContent = '0';
    isLoading = true;
    updateSendButtonState();
    clearErrors();

    /* Render user message */
    renderMessages();
    renderConversationList();

    /* Show loading indicator */
    showLoadingIndicator();

    try {
      /* Call AI API */
      const reply = await callAIAPI();

      /* Create assistant message */
      const assistantMessage = {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString()
      };

      /* Add to conversation */
      currentConversation.messages.push(assistantMessage);
      currentConversation.updatedAt = new Date().toISOString();

      /* Save conversation */
      saveConversation(currentConversation);

      /* Hide loading and render */
      hideLoadingIndicator();
      renderMessages();
      renderConversationList();

    } catch (error) {
      hideLoadingIndicator();
      showError(error.message, true);
    } finally {
      isLoading = false;
      updateSendButtonState();
      messageInput.focus();
    }
  }

  /* ══════════════════════════════════════════════════════════
     API Integration
     ══════════════════════════════════════════════════════════ */

  async function callAIAPI() {
    try {
      const token = SB.getToken();
      if (!token) {
        throw new Error('Session expired. Please log in again.');
      }

      /* Extract context window (last 10 messages) */
      const contextWindow = currentConversation.messages.slice(-CONTEXT_WINDOW_SIZE);

      /* Make API request */
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${API}/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: currentConversation.id,
          messages: contextWindow
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      /* Handle authentication errors */
      if (response.status === 401) {
        showError('Session expired. Redirecting to login...');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
        throw new Error('Session expired. Please log in again.');
      }

      /* Handle other errors */
      if (!response.ok) {
        throw new Error('Unable to reach AI service. Please try again.');
      }

      const data = await response.json();
      return data.reply;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('The AI is taking longer than expected. Please try again.');
      } else if (error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw error;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════
     Utility Functions
     ══════════════════════════════════════════════════════════ */

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
  }

  function formatAIResponse(content) {
    /* Escape HTML first */
    let formatted = escapeHtml(content);

    /* Format bold text (markdown-style) */
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    /* Convert newlines to <br> */
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  function formatTimestamp(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    /* Format as date */
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

})();
