// Node.js WebSocket Server for Deepgram Voice Agent
import 'dotenv/config';
import WebSocket from 'ws';

const DEEPGRAM_CONFIG = {
  type: "Settings",
  audio: {
    input: {
      encoding: "linear16",
      sample_rate: 48000
    },
    output: {
      encoding: "linear16",
      sample_rate: 24000,
      container: "none"
    }
  },
  agent: {
    language: "en",
    speak: {
      provider: {
        type: "eleven_labs",
        model_id: "eleven_multilingual_v2",
        voice_id: "cgSgspJ2msm6clMCkdW9"
      }
    },
    listen: {
      provider: {
        type: "deepgram",
        version: "v1",
        model: "nova-3"
      }
    },
    think: {
      provider: {
        type: "groq",
        model: "openai/gpt-oss-20b"
      },
      prompt: `You are a friendly English teacher having a REAL conversation with your student.

## CRITICAL RULE:

**ALWAYS respond to what they said FIRST, like a normal person would. THEN teach.**

If they ask you a question → Answer it naturally
If they tell you something → Respond to it genuinely  
If they share a story → React and engage with it

**ONLY AFTER** responding naturally should you add a brief correction or teaching point.

## BAD EXAMPLE (Too robotic):

User: "How is you today?"
❌ AI: "Hey! I think you meant 'How ARE you today?' - the verb goes before the subject."

## GOOD EXAMPLE (Natural conversation):

User: "How is you today?"
✅ AI: "I'm doing great, thanks for asking! Just finished my morning coffee. How about you - how's your day going so far? 

Oh, quick note: it's 'how ARE you' not 'how IS you' - 'you' always pairs with 'are' in English."

---

## YOUR PROCESS (Every Response):

1. **Read what they said** - What are they asking/telling/sharing?
2. **Respond naturally** - Answer their question or react to their statement (2-4 sentences)
3. **Continue the conversation** - Ask a follow-up question or share something relevant
4. **Then teach** - Add ONE brief correction/tip naturally (1-2 sentences)

## CORRECTION STYLE:

Vary how you correct - don't be formulaic:

- "By the way..."
- "Oh, just so you know..."
- "Quick thing..."
- "One small note..."
- "I noticed you said... it's actually..."
- Sometimes just model correct usage naturally in your response

## REMEMBER:

You're a PERSON who happens to be teaching, not a teaching robot.  
Have a real conversation. Teach while chatting.`
    },
    greeting: "Hello! How may I help you?"
  }
};

// Export WebSocket handler for use in combined server
export function setupWebSocket(wss: WebSocket.Server): void {
  const DEEPGRAM_KEY = process.env.DEEPGRAM_KEY;

  wss.on('connection', (clientWs: WebSocket) => {
    console.log('[Client] Connected');

    let deepgramWs: WebSocket | null = null;

    try {
      if (!DEEPGRAM_KEY) {
        console.error('[Error] DEEPGRAM_KEY not found in environment');
        clientWs.send(JSON.stringify({ type: 'Error', error: 'Server configuration error' }));
        clientWs.close();
        return;
      }

      deepgramWs = new WebSocket('wss://agent.deepgram.com/v1/agent/converse', {
        headers: { 'Authorization': `Token ${DEEPGRAM_KEY}` }
      });

      deepgramWs.on('open', () => {
        console.log('[Deepgram] Connected');
        deepgramWs!.send(JSON.stringify(DEEPGRAM_CONFIG));
        console.log('[Deepgram] Configuration sent');
      });

      deepgramWs.on('message', (data: WebSocket.RawData) => {
        const isBinary = Buffer.isBuffer(data);

        if (clientWs.readyState === WebSocket.OPEN) {
          if (isBinary) {
            try {
              const text = data.toString('utf8');
              const parsed = JSON.parse(text);
              console.log('[Deepgram →] Message type:', parsed.type);
              clientWs.send(text);
            } catch (e) {
              clientWs.send(data);
            }
          } else {
            try {
              const parsed = JSON.parse(data.toString());
              console.log('[Deepgram →] Message type:', parsed.type);
            } catch (e) { }
            clientWs.send(data);
          }
        }
      });

      deepgramWs.on('close', () => {
        console.log('[Deepgram] Disconnected');
      });

      deepgramWs.on('error', (error: Error) => {
        console.error('[Deepgram] Error:', error.message);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'Error', error: 'Deepgram connection failed' }));
        }
      });

      clientWs.on('message', (data: WebSocket.RawData) => {
        if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
          deepgramWs.send(data);
        }
      });

      clientWs.on('close', () => {
        console.log('[Client] Disconnected');
        if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
          deepgramWs.close();
        }
      });

      clientWs.on('error', (error: Error) => {
        console.error('[Client] Error:', error.message);
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Server] Error:', errorMessage);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'Error', error: 'Server error' }));
        clientWs.close();
      }
    }
  });
}
