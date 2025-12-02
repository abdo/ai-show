// ============================================================================
// interview-bun.ts - Self-Contained Bun Interview WebSocket Server
// ============================================================================
// Standalone TypeScript server for Railway deployment using Bun runtime
// Dynamically generates interviewer prompts using Groq API

// Bun type declarations
declare const Bun: any;

const PORT = process.env.PORT || 3001;
const DEEPGRAM_KEY = process.env.DEEPGRAM_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const interviewers = [
  {
    name: "Kevin McCannly",
    speakObject: {
      provider: {
        type: "eleven_labs",
        model_id: "eleven_multilingual_v2",
        voice_id: "onwK4e9ZLuTAKqWW03F9"
      }
    }
  },
  {
    name: "Michael Crickett",
    speakObject: {
      "provider": {
        "type": "deepgram",
        "model": "aura-2-odysseus-en"
      }
    },
  },
  {
    name: "Tom Bradshaw",
    speakObject: {
      "provider": {
        "type": "deepgram",
        "model": "aura-arcas-en"
      }
    },
  },
  {
    name: "Lauren Ashford",
    speakObject: {
      "provider": {
        "type": "deepgram",
        "model": "aura-2-delia-en"
      }
    },
  }
];

// ============================================================================
// PROMPT GENERATION
// ============================================================================

// Meta-prompt template for generating interviewer prompts
function getInterviewerMetaPrompt(role: string, interviewerName: string): string {
  return `what prompt should i give to a voice agent ai to act like an interviewer for the user? specifically an interviewer for a ${role} role, not the HR interview, the actual expert is interviewing. give me full extensive prompt. don't give the ai agent specific questions, give 100 questions the ai agent will choose randomly from: 90 technical questions related to their direct work, and 10 of which are behavioral questions, all 100 should be mixed (the 10 behavioral don't have to be the last 10), and the ai agent should only choose some randomly from them (make sure the agent understands that). IMPORTANT: Do not ask any coding questions or questions that require the user to write or read code, as this is a voice-only interview. Focus on conceptual and theoretical questions. also make the interview not so long, it should start friendly though by one or two normal interview questions like introductions. For the record the interviewer name is ${interviewerName}, and if the user asks the ai agent any personal questions they can make things up that make sense, like they are human not AI, if the user ask about interview structure they also should give an answer that makes sense, telling them about some kind of structure they are following (they shouldn't mention the random questions lists for example). also ask the model to give feedback in the end to the user, the agent must be honest on how they see the candidate and how they stand. CRITICAL INSTRUCTION: The agent must NEVER use markdown formatting (like **bold**, *italics*, or lists) in its responses. It must speak in plain text only, as the output will be read by a text-to-speech engine which gets confused by special characters. Explicitly tell the agent to avoid asterisks. only answer with the prompt, your answer should start with "You are..", I will take your output and give it directly to the ai agent, don't put specific format in the prompt like code format or md format, try to make it all normal text`;
}

// Generate interviewer prompt using Groq API
async function generateInterviewerPrompt(role: string, interviewerName: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing');
  }

  const metaPrompt = getInterviewerMetaPrompt(role, interviewerName);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: metaPrompt }],
        model: "openai/gpt-oss-120b",
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from Groq API');
    }

    return content.replace(/\*/g, '').trim();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Groq] Failed to generate interviewer prompt:', errorMessage);
    throw new Error(`Failed to generate interviewer prompt: ${errorMessage}`);
  }
}

// Deepgram config with custom prompt
function getDeepgramConfig(prompt: string, greeting: string, speakConfig: any) {
  return {
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
      speak: speakConfig,
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
        prompt: prompt
      },
      greeting: greeting
    }
  };
}

// ============================================================================
// BUN WEBSOCKET SERVER
// ============================================================================

Bun.serve({
  port: PORT as number,

  fetch(req: Request, server: any): Response | undefined {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'interview-server-bun' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // WebSocket upgrade for /interview endpoint
    if (url.pathname === '/interview') {
      const success = server.upgrade(req, {
        data: {
          url: req.url
        }
      });
      if (success) {
        return undefined; // Return undefined when upgrade succeeds
      }
      return new Response('WebSocket upgrade failed', { status: 400 });
    }

    return new Response('Not found', { status: 404 });
  },

  websocket: {
    async open(ws: any) {
      console.log('[Interview] Client connected');

      try {
        // Parse URL from request
        const url = new URL((ws.data as any)?.url || 'http://localhost');
        const role = url.searchParams.get('role');
        const requestedInterviewerName = url.searchParams.get('interviewerName');

        // Validate role parameter
        if (!role) {
          console.error('[Interview] Missing required "role" parameter');
          ws.send(JSON.stringify({
            type: 'Error',
            error: 'Missing required parameter: role'
          }));
          ws.close();
          return;
        }

        console.log('[Interview] Role:', role);
        console.log('[Interview] Requested Interviewer:', requestedInterviewerName);

        // Validate environment
        if (!DEEPGRAM_KEY) {
          throw new Error('DEEPGRAM_KEY not found in environment');
        }

        // Select interviewer based on request or default to first
        let selectedInterviewer = interviewers[0];
        if (requestedInterviewerName) {
          const found = interviewers.find(i => i.name === requestedInterviewerName);
          if (found) {
            selectedInterviewer = found;
          } else {
            console.warn(`[Interview] Requested interviewer "${requestedInterviewerName}" not found, defaulting to ${selectedInterviewer.name}`);
          }
        }

        console.log(`[Interview] Using interviewer: ${selectedInterviewer.name}`);

        // Step 1: Generate interviewer prompt using Groq
        console.log('[Interview] Generating interviewer prompt via Groq...');
        const interviewerPrompt = await generateInterviewerPrompt(role, selectedInterviewer.name);
        console.log('[Interview] Prompt generated successfully');

        // Step 2: Create Deepgram config
        const DEEPGRAM_CONFIG = getDeepgramConfig(
          interviewerPrompt,
          "Hello, welcome to your interview.",
          selectedInterviewer.speakObject
        );

        // Step 3: Connect to Deepgram
        const deepgramWs = new WebSocket('wss://agent.deepgram.com/v1/agent/converse', {
          headers: {
            'Authorization': `Token ${DEEPGRAM_KEY}`
          }
        });

        // Store Deepgram WebSocket reference
        (ws as any).deepgramWs = deepgramWs;

        deepgramWs.onopen = () => {
          console.log('[Deepgram] Connected');
          deepgramWs.send(JSON.stringify(DEEPGRAM_CONFIG));
          console.log('[Deepgram] Configuration sent');
        };

        deepgramWs.onmessage = (event: MessageEvent) => {
          const data = event.data;

          // Handle different data types from Deepgram
          if (typeof data === 'string') {
            try {
              const parsed = JSON.parse(data);
              console.log('[Deepgram →] Message type:', parsed.type);
            } catch (e) {
              // Not JSON, just pass through
            }
            ws.send(data);
          } else if (data instanceof ArrayBuffer || data instanceof Blob) {
            // Binary audio data - pass through
            ws.send(data);
          } else {
            // Unknown type - try to send as-is
            ws.send(data);
          }
        };

        deepgramWs.onclose = () => {
          console.log('[Deepgram] Disconnected');
        };

        deepgramWs.onerror = (error: any) => {
          console.error('[Deepgram] Error:', error);
          ws.send(JSON.stringify({ type: 'Error', error: 'Deepgram connection failed' }));
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Interview] Error:', errorMessage);
        ws.send(JSON.stringify({ type: 'Error', error: errorMessage }));
        ws.close();
      }
    },

    message(ws: any, message: string | Buffer) {
      // Forward client messages to Deepgram
      const deepgramWs = (ws as any).deepgramWs;
      if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
        deepgramWs.send(message);
      }
    },

    close(ws: any) {
      console.log('[Interview] Client disconnected');
      const deepgramWs = (ws as any).deepgramWs;
      if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
        deepgramWs.close();
      }
    },

    error(ws: any, error: Error) {
      console.error('[Interview] Client error:', error.message);
    }
  }
});

console.log(`🚀 Bun Interview WebSocket server running on http://localhost:${PORT}`);
console.log(`🎤 WebSocket endpoint: ws://localhost:${PORT}/interview?role=YourRole`);

// Make this file a proper ES module
export { };
