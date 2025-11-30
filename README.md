# AI Show 🎭

AI Show transforms your stories into theatrical performances through AI-generated characters with unique personalities and realistic voices.

![AI Show Banner](/public/og-image.png)

## ✨ Features

- **Two Modes**: Story Mode (dramatic re-enactment) or Conversation Mode (dynamic discussion)
- **AI-Powered**: Uses Groq AI for story generation and OpenAI TTS for voice synthesis
- **Cinematic Visuals**: 3D ChromaGrid spotlight system that highlights speakers in real-time
- **Real-Time Voice Chat**: English learning conversations with Deepgram voice agent

## 🛠️ Tech Stack

**Frontend:** React 19, TypeScript, Vite, GSAP, OGL (WebGL)  
**Backend:** Node.js + TypeScript (deployed as Bun on Railway)

## 🚀 Quick Start

### Prerequisites
- Node.js v20+
- API Keys: [Groq](https://console.groq.com/keys), [OpenAI](https://platform.openai.com/api-keys), [Deepgram](https://console.deepgram.com/)

### Installation

```bash
# Clone and install
git clone https://github.com/abdo/ai-show
cd ai-show
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Configure Environment Variables

**Frontend** (`.env` in project root):
```env
VITE_POSTHOG_API_KEY=phc_...  # Optional analytics
```

**Backend** (`server/.env`):
```env
GROQ_API_KEY=gsk_...           # Required for story generation
OPENAI_TTS_API_KEY=sk-proj-... # Required for voice synthesis
DEEPGRAM_KEY=...               # Required for voice chat
PORT=3001                      # Optional, defaults to 3001
```

### Run Locally

```bash
npm run dev
```

This runs both frontend (`:5173`) and backend (`:3001`) concurrently.

**Separate terminals:**
```bash
# Terminal 1: Frontend
npm run dev:frontend

# Terminal 2: Backend
npm run dev:backend
```

> [!TIP]
> **Quick Environment Check**: 
> - Frontend: `src/services/apiUrl.ts` → Should point to `http://localhost:3001/getShow`
> - Backend: Ensure `.env` has all required API keys

## 📁 Project Structure

```
ai-show/
├── src/                      # Frontend code
│   ├── components/          # React components
│   ├── pages/               # Page components
│   ├── services/            # API client
│   └── hooks/               # Custom hooks
│
├── server/                  # Node.js backend
│   ├── getShow-node.ts      # Story generation service
│   ├── talk-node.ts         # WebSocket voice chat
│   ├── server.ts            # Main server
│   ├── getShow-bun.ts       # Bun deployment version
│   └── talk-bun.ts          # Bun WebSocket version
│
└── package.json             # Frontend dependencies
```

## 🚀 Deployment

The backend is deployed to Railway using Bun runtime for optimal performance. The `-bun.ts` files are standalone versions optimized for Bun deployment.

## 📝 License

MIT
