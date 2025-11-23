# AI Show 🎭

AI Show transforms your stories into theatrical performances through AI-generated characters with unique personalities and realistic voices.

![AI Show Banner](/public/og-image.png)

## ✨ Features

- **Two Modes**: Story Mode (dramatic re-enactment) or Conversation Mode (dynamic discussion)
- **AI-Powered**: Uses Groq AI for story generation and OpenAI TTS for voice synthesis
- **Cinematic Visuals**: 3D ChromaGrid spotlight system that highlights speakers in real-time

## 🛠️ Tech Stack

**Frontend:** React 19, TypeScript, Vite, GSAP, OGL (WebGL)  
**Backend:** Firebase Cloud Functions (Node.js 24), TypeScript

## 🚀 Quick Start

### Prerequisites
- Node.js v24+
- Firebase CLI: `npm install -g firebase-tools`
- API Keys: [Groq](https://console.groq.com/keys), [OpenAI](https://platform.openai.com/api-keys)

### Installation

```bash
# Clone and install
git clone https://github.com/abdo/ai-show
cd ai-show
npm install

# Install backend dependencies
cd backend/functions
npm install
cd ../..
```

### Configure Environment Variables

**Frontend** (`.env` in project root):
```env
VITE_POSTHOG_API_KEY=phc_...  # Optional analytics
```

**Backend** (`backend/functions/.env`):
```env
GROQ_API_KEY=gsk_...          # Required
OPENAI_TTS_API_KEY=sk-proj-... # Required
```

### Run Locally

**Option 1: Single Command (Recommended)**
```bash
npm run dev
```
This runs both frontend and backend concurrently in one terminal.

**Option 2: Separate Terminals**
```bash
# Terminal 1: Frontend
npm run dev:frontend

# Terminal 2: Backend
npm run dev:backend
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5000`

> [!TIP]
> **Quick Environment Check**: Before starting, verify these files have the correct dev URLs:
> - Frontend: `src/services/apiUrl.ts` → Should point to `http://localhost:5000/ai-show-afb45/us-central1/getShow`
> - Backend: `backend/functions/src/allowedOrigins.ts` → Should include `http://localhost:5173`

## 📁 Project Structure

```
ai-show/
├── src/                      # Frontend code
│   ├── components/          # React components
│   ├── pages/               # Page components
│   ├── services/            # API client
│   └── hooks/               # Custom hooks
│
├── backend/functions/
│   └── src/
│       ├── controllers/     # Request handlers
│       ├── services/        # Business logic (story/voice)
│       ├── constants/       # Prompts and character data
│       └── config.ts        # Environment config loader
│
└── package.json             # Frontend dependencies
```

## 📝 License

MIT
