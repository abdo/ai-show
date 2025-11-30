import { useState, useCallback, useRef, useEffect } from 'react';
import { talkWsUrl } from '../services/apiUrl';

interface DeepgramMessage {
  type: string;
  [key: string]: unknown;
}

interface ConversationTextMessage {
  type: 'ConversationText';
  role: string;
  content: string;
  [key: string]: unknown;
}

// Type guard to safely check if a message is a ConversationTextMessage
function isConversationTextMessage(message: DeepgramMessage): message is ConversationTextMessage {
  return (
    message.type === 'ConversationText' &&
    typeof (message as any).role === 'string' &&
    typeof (message as any).content === 'string'
  );
}

export function useDeepgramVoice(onAudioData: (base64Audio: string) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const keepAliveIntervalRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    try {
      // Connect to our backend WebSocket server
      const ws = new WebSocket(talkWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Connected to server');
      };

      ws.onmessage = (event) => {
        // Handle binary messages (audio data)
        if (event.data instanceof Blob) {
          event.data.arrayBuffer().then((buffer) => {
            const base64Audio = btoa(
              String.fromCharCode(...new Uint8Array(buffer))
            );
            console.log('🔊 Received audio data');
            onAudioData(base64Audio);
          });
          return;
        }

        // Handle text messages (JSON)
        try {
          const message: DeepgramMessage = JSON.parse(event.data);
          console.log('📥 Received:', message.type);

          switch (message.type) {
            case 'SettingsApplied':
              console.log('⚙️ Settings applied - SETTING CONNECTED=TRUE');
              setIsConnected(true);
              setError(null);

              // Start keep-alive after settings are applied
              keepAliveIntervalRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: 'KeepAlive' }));
                  console.log('💓 KeepAlive sent');
                }
              }, 5000);
              break;

            case 'Welcome':
              console.log('👋 Welcome received');
              break;

            case 'ConversationText': {
              if (isConversationTextMessage(message)) {
                if (message.role === 'user') {
                  setUserTranscript(message.content);
                } else if (message.role === 'assistant') {
                  setAgentResponse(message.content);
                }
              }
              break;
            }

            case 'UserStartedSpeaking':
              console.log('🎤 User started speaking');
              setUserTranscript('');
              break;

            case 'AgentStartedSpeaking':
              console.log('🔊 Agent started speaking');
              break;

            case 'Error':
              console.error('❌ Error:', message);
              setError(JSON.stringify(message));
              break;

            default:
              console.log('ℹ️ Other message:', message.type, message);
          }
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('❌ WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
        }
      };

    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  }, [onAudioData]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    setIsConnected(false);
    setUserTranscript('');
    setAgentResponse('');
  }, []);

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Send audio as binary
      wsRef.current.send(audioData);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendAudio,
    isConnected,
    userTranscript,
    agentResponse,
    error
  };
}
