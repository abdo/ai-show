// ============================================================================
// jobs-bun.ts - Self-Contained Bun Server for Job Autocomplete
// ============================================================================
// Standalone TypeScript server for Railway deployment using Bun runtime

// Bun type declarations
declare const Bun: any;

const PORT = process.env.PORT || 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://ai-show-theta.vercel.app",
  "https://aishow.studio"
];

// Generate job suggestions using Groq API
async function getJobSuggestions(query: string): Promise<string[]> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing');
  }

  const prompt = `You are a job title autocomplete system. Given the partial input "${query}", suggest up to 8 REAL, commonly recognized job titles that start with or contain this text.

CRITICAL RULES:
1. ONLY suggest legitimate, well-known job titles that actually exist
2. If the input doesn't match any real job titles, return an empty array: []
3. Do NOT make up fake jobs or add the input text as a suffix to random words
4. Return ONLY a JSON array of strings with no other text

Examples:
- Input "soft" → ["Software Engineer", "Software Developer", "Software Architect"]
- Input "data" → ["Data Scientist", "Data Analyst", "Data Engineer"]
- Input "xyz123" → []
- Input "random gibberish" → []`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 200
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

    // Parse the JSON response
    const parsed = JSON.parse(content);

    // Handle different possible response formats
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
      return parsed.suggestions;
    } else if (parsed.jobs && Array.isArray(parsed.jobs)) {
      return parsed.jobs;
    }

    // If we can't find an array, return the first array we find in the object
    const firstArray = Object.values(parsed).find(val => Array.isArray(val));
    return firstArray as string[] || [];

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Jobs] Failed to get suggestions:', errorMessage);
    throw new Error(`Failed to get job suggestions: ${errorMessage}`);
  }
}

// ============================================================================
// BUN HTTP SERVER
// ============================================================================

Bun.serve({
  port: PORT as number,

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get('origin') || '';
    const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

    // Build CORS headers
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Only set Allow-Origin if the origin is allowed
    if (isAllowedOrigin) {
      corsHeaders['Access-Control-Allow-Origin'] = origin;
    }

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      if (!isAllowedOrigin) {
        return new Response('Forbidden', { status: 403 });
      }
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'jobs-autocomplete-bun' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Jobs autocomplete endpoint
    if (url.pathname === '/jobs/autocomplete' && req.method === 'POST') {
      // Reject requests from non-allowed origins
      if (!isAllowedOrigin) {
        return new Response(JSON.stringify({
          error: {
            code: 'FORBIDDEN',
            message: 'Origin not allowed'
          }
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const body = await req.json();

        if (!body.query || body.query.trim().length === 0) {
          return new Response(JSON.stringify({
            error: {
              code: 'BAD_REQUEST',
              message: 'query is required'
            }
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const query = body.query.trim();
        console.log('[Jobs] Autocomplete request for:', query);

        const suggestions = await getJobSuggestions(query);
        console.log('[Jobs] Returning', suggestions.length, 'suggestions');

        return new Response(JSON.stringify({ suggestions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Jobs] Error:', errorMessage);

        return new Response(JSON.stringify({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: errorMessage
          }
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
});

console.log(`🚀 Bun Jobs Autocomplete server running on http://localhost:${PORT}`);
console.log(`💼 Endpoint: POST http://localhost:${PORT}/jobs/autocomplete`);

// Make this file a proper ES module
export { };
