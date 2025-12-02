import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDeepgramVoice } from '../../hooks/useDeepgramVoice';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import './ConversationPage.css';

// Avatar for the interviewer
const INTERVIEWER_AVATAR_MALE = "https://i.ibb.co/z09VvvW/interviewer-male.webp";
const INTERVIEWER_AVATAR_FEMALE = "https://i.ibb.co/v5Dmy6b/interviewer-female.webp";

const INTERVIEWERS = [
  "Kevin McCannly",
  "Michael Crickett",
  "Tom Bradshaw",
  "Lauren Ashford"
];

export function ConversationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Select random interviewer on mount
  const [interviewerName] = useState(() => {
    return INTERVIEWERS[Math.floor(Math.random() * INTERVIEWERS.length)];
  });
  
  const { playAudio, stop, isPlaying } = useAudioPlayer();
  const { startRecording, stopRecording, isRecording } = useAudioRecorder();
  const { 
    connect, 
    disconnect, 
    sendAudio, 
    isConnected,
    messages,
    error 
  } = useDeepgramVoice(playAudio);

  // Redirect if no role provided
  useEffect(() => {
    if (!role) {
      navigate('/', { replace: true });
    }
  }, [role, navigate]);

  // Auto-scroll to bottom of transcript
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Determine current state
  const getState = () => {
    if (isPlaying) return 'speaking';
    if (isRecording) return 'listening';
    return 'idle';
  };

  const state = getState();

  const handleEnd = () => {
    stopRecording();
    stop();
    disconnect();
    navigate('/');
  };

  // Auto-start call when page loads
  useEffect(() => {
    const startCall = async () => {
      if (!role) return;
      
      // Connect to interview endpoint with role and selected interviewer
      connect(role, interviewerName);
      
      // Wait for connection then start recording
      setTimeout(async () => {
        await startRecording((audioData) => {
          sendAudio(audioData);
        });
      }, 1000);
    };

    startCall();

    // Cleanup on unmount
    return () => {
      stopRecording();
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="conversation-page">
      {/* Sidebar / Info Panel */}
      <aside className="interview-sidebar">
        <div className="interviewer-profile">
          <div className={`avatar-container ${state}`}>
            <img 
              src={interviewerName === "Lauren Ashford" ? INTERVIEWER_AVATAR_FEMALE : INTERVIEWER_AVATAR_MALE} 
              alt="Interviewer" 
              className="avatar-img" 
            />
          </div>
          <h2 className="interviewer-name">{interviewerName}</h2>
          <p className="interview-role">{role} Interview</p>
        </div>

        <div className="connection-status">
          <div className={`status-dot ${isConnected ? 'connected' : 'connecting'}`}></div>
          <span className="status-text">
            {!isConnected && "Connecting..."}
            {isConnected && state === 'listening' && "Listening..."}
            {isConnected && state === 'speaking' && "Speaking..."}
            {isConnected && state === 'idle' && "Connected"}
          </span>
        </div>

        <button className="end-call-btn" onClick={handleEnd}>
          End Interview
        </button>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-area">
        <div className="messages-list">
          {messages.length === 0 && (
            <div className="empty-state">
              <p>The interview is starting...</p>
              <p className="sub-text">Please allow microphone access if prompted.</p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`message-bubble ${msg.role}`}>
              <div className="message-header">
                <span className="message-sender">
                  {msg.role === 'user' ? 'You' : 'Interviewer'}
                </span>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="message-content">{msg.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="error-banner">
            Error: {error}
          </div>
        )}
      </main>
    </div>
  );
}
