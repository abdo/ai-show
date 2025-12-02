// Automatically switch between local and production based on environment
export const jobsApiUrl = import.meta.env.DEV
  ? "http://localhost:3001/jobs/autocomplete"
  : "https://jobs-autocomplete-production.up.railway.app/jobs/autocomplete";

// WebSocket server for interview
export const interviewWsUrl = import.meta.env.DEV
  ? "ws://localhost:3001/interview"
  : "wss://interview-production-189c.up.railway.app/interview";

