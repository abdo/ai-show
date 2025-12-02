// Slim server wrapper - delegates to getShow and interview handlers
import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { handleGetShow } from './handlers/getShow/getShow';
import { setupInterviewWebSocket } from './handlers/interview/interview';
import { handleJobAutocomplete, isOriginAllowed } from './handlers/jobs/jobs';

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

// POST /jobs/autocomplete - Job role autocomplete
app.post('/jobs/autocomplete', async (req: Request, res: Response) => {
  const origin = req.headers.origin || '';

  // Validate origin
  if (!isOriginAllowed(origin)) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Origin not allowed'
      }
    });
  }

  try {
    const result = await handleJobAutocomplete(req.body);
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('required') || errorMessage.includes('missing') ? 400 : 500;

    console.error('[server] /jobs/autocomplete error:', errorMessage);
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

// WebSocket /interview - Delegates to interview handler  
console.log('[DEBUG] Creating interview WebSocket server...');
const interviewWss = new WebSocketServer({ noServer: true });
console.log('[DEBUG] Interview WebSocket server created, calling setupInterviewWebSocket...');
setupInterviewWebSocket(interviewWss);
console.log('[DEBUG] setupInterviewWebSocket called successfully');

// Handle upgrade requests manually to ensure correct routing
server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);

  if (pathname === '/interview') {
    interviewWss.handleUpgrade(request, socket, head, (ws) => {
      interviewWss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 AI Show server running on http://localhost:${PORT}`);
  console.log(`🎤 Interview WebSocket: ws://localhost:${PORT}/interview?role=YourRole`);
  console.log(`📬 HTTP POST: http://localhost:${PORT}/getShow`);
  console.log(`💼 HTTP POST: http://localhost:${PORT}/jobs/autocomplete`);
});

export { server };
