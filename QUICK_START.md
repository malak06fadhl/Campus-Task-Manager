# AI Support Assistant - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Get Your API Key
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key

### Step 2: Configure
Open `backend/.env` and add your key:
```env
GEMINI_API_KEY=AIzaSy...your_key_here
```

### Step 3: Run
```bash
cd backend
npm start
```

## 🎯 How to Use

1. **Open the app** in your browser
2. **Log in** as a student
3. **Click the 🤖 button** in the bottom-right corner
4. **Start chatting!**

## 💬 Try These Prompts

- "I have 3 assignments due this week and I'm feeling overwhelmed"
- "Help me prioritize my tasks for today"
- "I don't know where to start with my project"

## 📋 What You Get

The AI will respond with:
- **Priority Order**: What matters most
- **Start With**: Your first action
- **Today's Mini Plan**: 2-3 steps to take today
- **Support Note**: Encouragement

## ✅ Features

- 💾 Auto-saves all conversations
- 🔄 Remembers last 10 messages for context
- 📱 Works on mobile, tablet, and desktop
- 🔒 Secure (JWT authentication required)
- ⚡ Fast (30-second timeout)
- 🎨 Matches StudyBalance design

## 🛠️ Troubleshooting

**"AI service unavailable"**
→ Check your API key in `backend/.env`

**Button not showing**
→ Make sure you're logged in as a student

**Server won't start**
→ Run `npm install` in the backend folder

## 📚 More Info

- Full setup guide: `AI_ASSISTANT_SETUP.md`
- Implementation details: `IMPLEMENTATION_COMPLETE.md`
- Requirements: `.kiro/specs/ai-support-assistant/requirements.md`

---

**That's it!** The AI Support Assistant is ready to help students organize their workload. 🎉
