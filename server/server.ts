// Slim server wrapper - delegates to talk and getShow
import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { handleGetShow } from './getShow';
import { setupWebSocket } from './talk';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ai-show-server' });
});

// POST /getShow - Delegates to getShow handler
app.post('/getShow', async (req: Request, res: Response) => {
  try {
    const result = await handleGetShow(req.body);
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('required') || errorMessage.includes('missing') ? 400 : 500;

    console.error('[server] /getShow error:', errorMessage);
    res.status(statusCode).json({
      error: {
        code: statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
        message: errorMessage,
      },
    });
  }
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket /talk - Delegates to talk
const wss = new WebSocketServer({ server, path: '/talk' });
setupWebSocket(wss);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 AI Show server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}/talk`);
  console.log(`📬 HTTP POST: http://localhost:${PORT}/getShow`);
});

export { server, wss };
