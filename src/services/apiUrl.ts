// Automatically switch between local and production based on environment
const apiUrl = false
  ? "http://localhost:3001/getShow"
  : "https://getshow-production.up.railway.app/getShow";

// WebSocket server for voice chat
export const talkWsUrl = false
  ? "ws://localhost:3001/talk"
  : "ws://function-bun-production-3d39.up.railway.app/talk";

export default apiUrl;