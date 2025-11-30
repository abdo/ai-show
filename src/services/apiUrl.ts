// Automatically switch between local and production based on environment
const apiUrl = import.meta.env.DEV
  ? "http://localhost:3001/getShow"
  : "https://getshow-production.up.railway.app/getShow";

// WebSocket server for voice chat
export const talkWsUrl = import.meta.env.DEV
  ? "ws://localhost:3001/talk"
  : "ws://function-bun-production-3d39.up.railway.app/talk";

export default apiUrl;