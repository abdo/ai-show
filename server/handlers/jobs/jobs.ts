// Node.js Handler for Job Autocomplete using Groq API
import 'dotenv/config';
import axios from 'axios';

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
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 200
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

    // Parse the JSON array response
    const parsed = JSON.parse(content.trim());

    // Return array directly if it's an array, otherwise return empty
    return Array.isArray(parsed) ? parsed : [];

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Jobs] Failed to get suggestions:', errorMessage);
    throw new Error(`Failed to get job suggestions: ${errorMessage}`);
  }
}

// Export handler
export async function handleJobAutocomplete(
  body: { query?: string }
): Promise<{ suggestions: string[] }> {
  // Validation
  if (!body.query || body.query.trim().length === 0) {
    throw new Error('query is required');
  }

  const query = body.query.trim();
  console.log('[Jobs] Autocomplete request for:', query);

  const suggestions = await getJobSuggestions(query);
  console.log('[Jobs] Returning', suggestions.length, 'suggestions');

  return { suggestions };
}

// CORS utility
export function isOriginAllowed(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin);
}
