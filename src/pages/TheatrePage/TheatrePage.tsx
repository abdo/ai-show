import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ChromaGrid from "../../components/ChromaGrid/ChromaGrid";
import ChromaGallery from "../../components/ChromaGallery/ChromaGallery";
import { VolumeControl } from "../../components/VolumeControl/VolumeControl";
import { DownloadIcon } from "../../ui/icons/DownloadIcon";
import { ReplayIcon } from "../../ui/icons/ReplayIcon";
import { PauseIcon } from "../../ui/icons/PauseIcon";
import { PlayIcon } from "../../ui/icons/PlayIcon";
import { ScrollTextIcon } from "../../ui/icons/ScrollTextIcon";
import { ScriptOverlay } from "../../components/ScriptOverlay/ScriptOverlay";
import { useShow } from "../../hooks/useShow";
import { useAudioPlayback } from "../../hooks/useAudioPlayback";
import { useDynamicallyZoomLargeScreens } from "../../hooks/useDynamicallyZoomLargeScreens";
import { BREAKPOINTS } from "../../constants/breakpoints";
import "./TheatrePage.css";

// Loading messages - defined outside component to avoid recreation
const LOADING_MESSAGES = [
  "Creating the scene",
  "Casting actors...",
  "Setting up the lighting...",
  "Adjusting camera angles...",
  "Doing rehearsals...",
  "Applying makeup...",
  "Positioning microphones...",
  "Preparing the stage...",
  "Reviewing the script...",
  "Preparing costumes...",
  "Warming up the actors...",
];

export function TheatrePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const topic = (location.state as { topic?: string; name?: string; mode?: string })?.topic || "";
  const routerName = (location.state as { topic?: string; name?: string; mode?: string })?.name;
  const mode = (location.state as { topic?: string; name?: string; mode?: string })?.mode || 'conversation';
  
  // Use name from router state, or fall back to localStorage, or undefined
  const userName = routerName || localStorage.getItem("userName") || undefined;

  const { story, audioMap: backendAudioMap, fetchShow, error } = useShow();

  const {
    loadAudioMap,
    playAllDialogue,
    stopAudio,
    unlockAudio,
    currentDialogueIndex,
    volume,
    isPaused,
    hasEnded,
    handleVolumeChange,
    togglePause,
    downloadConversation,
  } = useAudioPlayback();

  const [conversationStarted, setConversationStarted] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < BREAKPOINTS.TABLET);
  const [isScriptOverlayOpen, setIsScriptOverlayOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < BREAKPOINTS.TABLET);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamic scaling for large screens
  const scaleStyle = useDynamicallyZoomLargeScreens();

  // Redirect to home if no topic provided, fetch story once on mount
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    if (!topic) {
      navigate("/", { replace: true });
      return;
    }
    unlockAudio();
    
    setIsLoading(true);
    setLoadingMessageIndex(0);
    fetchShow(topic, userName, mode as 'conversation' | 'story');
    
    // Cycle through loading messages every second
    const messageInterval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);

    return () => clearInterval(messageInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, userName, navigate]);

  // Stop audio when component unmounts (navigating away)
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // Load audio map when backend data is ready
  useEffect(() => {
    if (story && backendAudioMap) {
      loadAudioMap(backendAudioMap, story.dialogue);
      setIsLoading(false);
    }
  }, [story, backendAudioMap, loadAudioMap]);

  // Convert characters to grid items format
  const gridItems = useMemo(() => {
    if (!story) return [];
    return story.characters.map((char) => ({
      id: char.id,
      image: char.image,
      title: char.name,
      subtitle: "",
      handle: `@${char.id}`,
      borderColor: char.borderColor,
      gradient: char.gradient,
      url: "",
    }));
  }, [story]);

  const startConversation = () => {
    if (!story || story.dialogue.length === 0) return;
    setConversationStarted(true);
    playAllDialogue(story.dialogue.length);
  };

  const replayConversation = () => {
    if (!story || story.dialogue.length === 0) return;
    stopAudio();
    playAllDialogue(story.dialogue.length);
  };

  const handleBack = () => {
    stopAudio();
    navigate("/");
  };

  const toggleScriptOverlay = () => {
    setIsScriptOverlayOpen(!isScriptOverlayOpen);
  };

  const downloadScript = () => {
    if (!story) return;

    const scriptContent = story.dialogue
      .map((line) => {
        const character = story.characters.find((c) => c.id === line.characterId);
        return `${character?.name || line.characterId}: ${line.text}`;
      })
      .join("\n\n");

    const blob = new Blob([scriptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_script.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleScriptClick = () => {
    if (isMobileView) {
      toggleScriptOverlay();
    } else {
      downloadScript();
    }
  };

  // Generate script content for overlay
  const scriptLines = useMemo(() => {
    if (!story) return [];
    return story.dialogue.map((line) => {
      const character = story.characters.find((c) => c.id === line.characterId);
      return {
        characterName: character?.name || line.characterId,
        text: line.text
      };
    });
  }, [story]);

  const allVoicesReady = useMemo(() => {
    return !isLoading && story !== null;
  }, [isLoading, story]);

  // Get the character currently speaking
  const speakingCharacterId = useMemo(() => {
    if (currentDialogueIndex === -1 || !story) return null;
    const characterId =
      story.dialogue[currentDialogueIndex]?.characterId || null;
    return characterId;
  }, [currentDialogueIndex, story]);

  // Truncate topic to ~10 words for display
  const { displayText: truncatedTopic, isTruncated } = useMemo(() => {
    const words = topic.split(' ');
    if (words.length <= 10) {
      return { displayText: topic, isTruncated: false };
    }
    return { displayText: words.slice(0, 10).join(' ') + '...', isTruncated: true };
  }, [topic]);

  return (
    <main className="theatre-page" style={scaleStyle}>
      {/* Desktop Back Button */}
      <button
        className="back-arrow-btn desktop-only"
        onClick={handleBack}
        aria-label="Go back to home"
      >
        ← Back
      </button>

      {/* Mobile Top Actions (Back, Audio, Script) */}
      <nav className="mobile-top-actions" aria-label="Mobile navigation">
        <button className="icon-btn" onClick={handleBack} aria-label="Go back to home">
          ←
        </button>
        <div className="right-actions">
          <button className="icon-btn" onClick={downloadConversation} aria-label="Download Audio">
            <DownloadIcon />
          </button>
          <button className="icon-btn" onClick={handleScriptClick} aria-label="View Script">
            <ScrollTextIcon />
          </button>
        </div>
      </nav>

      {/* Script Overlay for Mobile */}
      <ScriptOverlay
        isOpen={isScriptOverlayOpen && isMobileView}
        onClose={toggleScriptOverlay}
        scenario={topic}
        scriptLines={scriptLines}
      />

      {conversationStarted && (
        <>
          {/* Volume Control - Desktop Only */}
          {!isMobileView && (
            <VolumeControl volume={volume} onVolumeChange={handleVolumeChange} />
          )}

          <div className="theatre-lights" aria-hidden="true">
            <div className="light1">
              <div className="ray"></div>
            </div>
            <div className="light2">
              <div className="ray"></div>
            </div>
          </div>
        </>
      )}

      <header className="theatre-header">
        <h1 className="scenario-text" {...(isTruncated ? { title: topic } : {})}>"{truncatedTopic}"</h1>
        
        <div className={`start-controls ${conversationStarted ? "hidden" : ""}`}>
          <div className="status-line" role="status" aria-live="polite">
            {isLoading && <span className="status">{LOADING_MESSAGES[loadingMessageIndex]}</span>}
            {!isLoading && (
              <span className="status-ready">Ready to play</span>
            )}
          </div>

          {allVoicesReady && gridItems.length > 0 && (
            <button
              className="play-story-btn"
              onClick={startConversation}
              aria-label="Start the show"
            >
              ▶ Start the show
            </button>
          )}
        </div>

        {error && <p className="error-text" role="alert">{error}</p>}
      </header>

      {allVoicesReady && gridItems.length > 0 && (
        <>
          {/* Mobile Bottom Controls (Play/Pause, Replay) */}
          {conversationStarted && isMobileView && (
            <div className="mobile-bottom-controls" role="group" aria-label="Playback controls">
              <button className="control-btn main-control" onClick={togglePause} aria-label={hasEnded ? "Play Again" : isPaused ? "Resume" : "Pause"}>
                {hasEnded || isPaused ? <PlayIcon /> : <PauseIcon />}
              </button>
              <button className="control-btn" onClick={replayConversation} aria-label="Replay conversation">
                <ReplayIcon />
              </button>
            </div>
          )}

          {/* Desktop Side Actions */}
          {conversationStarted && (
            <aside className="side-actions desktop-only" aria-label="Playback controls">
              <button
                className="side-action-btn pause-side-btn"
                onClick={togglePause}
                title={
                  hasEnded ? "Play Again" : isPaused ? "Resume" : "Pause"
                }
                aria-label={hasEnded ? "Play Again" : isPaused ? "Resume" : "Pause"}
              >
                {hasEnded || isPaused ? <PlayIcon /> : <PauseIcon />}
              </button>
              <button
                className="side-action-btn replay-side-btn"
                onClick={replayConversation}
                title="Replay"
                aria-label="Replay conversation"
              >
                <ReplayIcon />
              </button>
              <button
                className="side-action-btn download-side-btn"
                onClick={downloadConversation}
                title="Download Audio"
                aria-label="Download Audio"
              >
                <DownloadIcon />
              </button>
              <button
                className="side-action-btn download-script-btn"
                onClick={handleScriptClick}
                title="Download Script"
                aria-label="Download Script"
              >
                <ScrollTextIcon />
              </button>
            </aside>
          )}

          <section className="grid-wrapper" aria-label="Character stage">
            {isMobileView ? (
              <ChromaGallery
                items={gridItems}
                speakingCharacterId={speakingCharacterId}
              />
            ) : (
              <ChromaGrid
                items={gridItems}
                radius={340}
                columns={Math.min(5, gridItems.length)}
                rows={Math.ceil(gridItems.length / 5)}
                selectedPersonaId={speakingCharacterId}
              />
            )}
          </section>
        </>
      )}
    </main>
  );
}
