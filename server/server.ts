// Slim server wrapper - delegates to talk-node and getShow-node
import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { handleGetShow } from './getShow-node';
import { setupWebSocket } from './talk-node';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ai-show-server' });
});

// POST /getShow - Delegates to getShow-node
app.post('/getShow', async (req: Request, res: Response) => {
  try {
    const { userInput, userName, mode } = req.body;

    if (!userInput) {
      return res.status(400).json({ error: 'userInput is required' });
    }

    console.log('[getShow] Request received');
    const result = await handleGetShow(userInput, userName, mode);
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('[getShow] Error:', errorMessage);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: errorMessage,
      },
    });
  }
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket /talk - Delegates to talk-node
const wss = new WebSocketServer({ server, path: '/talk' });
setupWebSocket(wss);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 AI Show server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}/talk`);
  console.log(`📬 HTTP POST: http://localhost:${PORT}/getShow`);
});

export { server, wss };
