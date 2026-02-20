# 🧠 MindWatch — AI Mental Health Platform

> **MERN Stack** · **Groq AI (LLaMA-3.3-70b)** · **MongoDB Atlas** · **React + Vite**

MindWatch is a complete AI-powered mental health support application that analyzes emotions, provides personalized therapy conversations, tracks moods, and guides users through mindfulness exercises.

---

## 🚀 Quick Start

### 1. Configure Environment Variables

Edit `mindwatch-backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/mindwatch?retryWrites=true&w=majority
JWT_SECRET=your_very_secret_key_here
GROQ_API_KEY=your_groq_api_key_here
FRONTEND_URL=http://localhost:5173
```

### 2. Start Backend

```bash
cd mindwatch-backend
npm install        # already done
npm run dev        # starts on http://localhost:5000
```

### 3. Start Frontend

```bash
cd mindwatch-frontend
npm install        # already done
npm run dev        # starts on http://localhost:5173
```

### 4. Open Browser

Navigate to **http://localhost:5173** and register a new account.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Therapy Chat** | Real-time conversations with Groq LLaMA-3.3-70b |
| 🎭 **Emotion Analysis** | Every message & journal entry analyzed for emotions |
| 📊 **Mood Tracker** | Log moods 1-10, track triggers, view trend charts |
| 📖 **AI Journal** | Write entries with automatic AI emotion analysis |
| 🌿 **Mindfulness** | Breathing exercises with animated circle guide |
| ⚠️ **Crisis Detection** | Auto-detects distress signals, shows emergency resources |
| 📈 **Analytics** | 30-day overview, stress reports, weekly AI summary |
| 🔥 **Streak Tracking** | Daily login streak to build healthy habits |

---

## 🏛️ Architecture

```
mindwatch-backend/
├── server.js              # Express entry point
├── models/
│   ├── User.js            # Auth + streak
│   ├── MoodLog.js         # Mood entries
│   ├── JournalEntry.js    # Journal with AI analysis
│   ├── ChatSession.js     # Chat history
│   └── BreathingSession.js
├── routes/
│   ├── auth.routes.js     # Register, Login, Me
│   ├── chat.routes.js     # AI chat via Groq
│   ├── mood.routes.js     # CRUD + stats
│   ├── journal.routes.js  # CRUD + AI analysis
│   ├── mindfulness.routes.js
│   └── analysis.routes.js # Overview, weekly summary
├── services/
│   ├── groqService.js     # Groq API integration
│   └── crisisService.js   # Crisis keyword detection
└── middleware/
    └── auth.js            # JWT protection

mindwatch-frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx / Register.jsx
│   │   ├── Dashboard.jsx   # Mood charts, stats
│   │   ├── Chat.jsx        # AI therapy interface
│   │   ├── MoodTracker.jsx # Emoji picker + charts
│   │   ├── Journal.jsx     # Editor + AI insights
│   │   ├── Mindfulness.jsx # Breathing animation
│   │   └── History.jsx     # Session history
│   ├── components/Sidebar.jsx
│   ├── context/AuthContext.jsx
│   └── services/api.js     # Axios + JWT interceptor
```

---

## 🔑 Getting Your API Keys

### Groq API Key
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up / Log in → API Keys → Create new

### MongoDB Atlas URI
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create cluster → Connect → Drivers → Copy URI
3. Replace `<username>`, `<password>`, `<cluster>` in `.env`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/chat/message` | Send AI therapy message |
| POST | `/api/mood` | Log mood |
| GET | `/api/mood/stats` | Mood statistics |
| POST | `/api/journal` | Create journal entry |
| GET | `/api/analysis/overview` | 30-day overview |
| GET | `/api/analysis/weekly-summary` | AI weekly summary |
| POST | `/api/mindfulness/session` | Log breathing session |
