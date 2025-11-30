import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeepgramVoice } from '../../hooks/useDeepgramVoice';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import './ConversationPage.css';

// Avatar for Joe
const JOE_AVATAR = "https://i.pravatar.cc/300?img=11";

export function ConversationPage() {
  const navigate = useNavigate();
  
  const { playAudio, stop, isPlaying } = useAudioPlayer();
  const { startRecording, stopRecording, isRecording } = useAudioRecorder();
  const { 
    connect, 
    disconnect, 
    sendAudio, 
    isConnected,
    userTranscript,
    agentResponse,
    error 
  } = useDeepgramVoice(playAudio);

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
      connect();
      
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
      <div className="avatar-container">
        <div className={`avatar-ring ${state}`}></div>
        <img src={JOE_AVATAR} alt="Joe" className="avatar-img" />
      </div>

      <div className="info-section">
        <h1 className="ai-name">Joe</h1>
        <p className="status-text">
          {!isConnected && "Connecting..."}
          {isConnected && state === 'listening' && "Listening..."}
          {isConnected && state === 'speaking' && "Speaking..."}
          {isConnected && state === 'idle' && "Waiting..."}
        </p>
      </div>

      {/* Transcript Display */}
      {(userTranscript || agentResponse) && (
        <div className="transcript-section">
          {userTranscript && (
            <div className="transcript-item user">
              <span className="role">You:</span>
              <span className="text">"{userTranscript}"</span>
            </div>
          )}
          {agentResponse && (
            <div className="transcript-item agent">
              <span className="role">Joe:</span>
              <span className="text">"{agentResponse}"</span>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      <div className="controls">
        <button className="call-btn end" onClick={handleEnd}>
          End Call ❌
        </button>
      </div>
    </div>
  );
}
