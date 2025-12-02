// Node.js WebSocket Server for Interview with Deepgram Voice Agent
import 'dotenv/config';
import WebSocket from 'ws';
import axios from 'axios';
import { URL } from 'url';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const DEEPGRAM_KEY = process.env.DEEPGRAM_KEY;

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
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        messages: [{ role: "user", content: metaPrompt }],
        model: "openai/gpt-oss-120b",
        temperature: 0.7,
        max_tokens: 3000,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    const content = response.data.choices[0]?.message?.content;
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

// Create Deepgram config with custom prompt
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

// Export WebSocket handler for interview sessions
export function setupInterviewWebSocket(wss: WebSocket.Server): void {
  wss.on('connection', (clientWs: WebSocket, req) => {
    console.log('[Interview] Client connected');

    // Parse URL query parameters
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const role = url.searchParams.get('role');
    const requestedInterviewerName = url.searchParams.get('interviewerName');

    console.log('[Interview] Role from URL:', role);
    console.log('[Interview] Requested Interviewer:', requestedInterviewerName);

    // Validate role parameter
    if (!role) {
      console.error('[Interview] Missing required "role" parameter');
      clientWs.send(JSON.stringify({
        type: 'Error',
        error: 'Missing required parameter: role'
      }));
      clientWs.close();
      return;
    }

    let deepgramWs: WebSocket | null = null;

    // Start async initialization in background
    (async () => {
      try {
        //Validate environment
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

        // Step 2: Create Deepgram config with generated prompt
        const DEEPGRAM_CONFIG = getDeepgramConfig(
          interviewerPrompt,
          "Hello, welcome to your interview.",
          selectedInterviewer.speakObject
        );

        // Step 3: Connect to Deepgram
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

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Interview] Error:', errorMessage);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'Error', error: errorMessage }));
          clientWs.close();
        }
      }
    })();

    // Client message forwarding
    clientWs.on('message', (data: WebSocket.RawData) => {
      if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
        deepgramWs.send(data);
      }
    });

    clientWs.on('close', () => {
      console.log('[Interview] Client disconnected');
      if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
        deepgramWs.close();
      }
    });

    clientWs.on('error', (error: Error) => {
      console.error('[Interview] Client error:', error.message);
    });
  });
}
