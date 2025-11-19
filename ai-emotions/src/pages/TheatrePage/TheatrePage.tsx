import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ChromaGrid from "../../components/ChromaGrid/ChromaGrid";
import { VolumeControl } from "../../components/VolumeControl/VolumeControl";
import { DownloadIcon } from "../../ui/icons/DownloadIcon";
import { ReplayIcon } from "../../ui/icons/ReplayIcon";
import { PauseIcon } from "../../ui/icons/PauseIcon";
import { PlayIcon } from "../../ui/icons/PlayIcon";
import { usePerspectives } from "../../hooks/usePerspectives";
import { usePersonaVoices } from "../../hooks/usePersonaVoices";
import "./TheatrePage.css";

export function TheatrePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const topic = (location.state as { topic?: string })?.topic || "";

  const { story, fetchStory, isLoading, error } = usePerspectives();

  const {
    generateAllVoices,
    playAllDialogue,
    stopAudio,
    unlockAudio,
    isGenerating,
    currentDialogueIndex,
    volume,
    isPaused,
    handleVolumeChange,
    togglePause,
    downloadConversation,
  } = usePersonaVoices();

  const [conversationStarted, setConversationStarted] = useState(false);

  // Redirect to home if no topic provided, fetch story once on mount
  useEffect(() => {
    if (!topic) {
      navigate("/", { replace: true });
      return;
    }
    unlockAudio();
    fetchStory(topic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, navigate]); // Only depend on topic and navigate, not the functions

  useEffect(() => {
    if (!story || !story.characters.length || !story.dialogue.length) return;
    generateAllVoices(story.dialogue, story.characters);
  }, [generateAllVoices, story]);

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

  const allVoicesReady = useMemo(() => {
    if (!story || isGenerating) return false;
    return story.dialogue.length > 0;
  }, [story, isGenerating]);

  // Get the character currently speaking
  const speakingCharacterId = useMemo(() => {
    if (currentDialogueIndex === -1 || !story) return null;
    const characterId = story.dialogue[currentDialogueIndex]?.characterId || null;
    console.log(`[Highlight] Index: ${currentDialogueIndex}, CharacterId: ${characterId}`);
    return characterId;
  }, [currentDialogueIndex, story]);

  return (
    <div className="theatre-page">
      <button className="back-arrow-btn" onClick={handleBack} aria-label="Go back">
        ← Back
      </button>

      {conversationStarted && (
        <>
          <VolumeControl volume={volume} onVolumeChange={handleVolumeChange} />
          
          <div className="theatre-lights">
            <div className="light1">
              <div className="ray"></div>
            </div>
            <div className="light2">
              <div className="ray"></div>
            </div>
          </div>
        </>
      )}

      <div className="theatre-header">
        <p className="scenario-text">"{topic}"</p>
        <div className="status-line">
          {isLoading && <span className="status">Writing the scene...</span>}
          {!isLoading && isGenerating && (
            <span className="status">Preparing voices...</span>
          )}
          {!isLoading && !isGenerating && allVoicesReady && (
            <span className="status-ready">Ready to play</span>
          )}
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>

      {allVoicesReady && gridItems.length > 0 && (
        <>
          <button
            className={`play-story-btn ${conversationStarted ? "hidden" : ""}`}
            onClick={startConversation}
          >
            ▶ Start the show
          </button>

          {conversationStarted && (
            <>
              {/* Mobile drawer */}
              <div className="mobile-drawer">
                <button
                  className="drawer-toggle"
                  onClick={() => {
                    const drawer = document.querySelector(".drawer-content");
                    drawer?.classList.toggle("open");
                  }}
                >
                  ☰ Actions
                </button>
                <div className="drawer-content">
                  <button className="drawer-action-btn" onClick={handleBack}>
                    ← Back
                  </button>
                  <button
                    className="drawer-action-btn drawer-icon-btn"
                    onClick={togglePause}
                  >
                    {isPaused ? (
                      <>
                        <PlayIcon /> Resume
                      </>
                    ) : (
                      <>
                        <PauseIcon /> Pause
                      </>
                    )}
                  </button>
                  <button
                    className="drawer-action-btn drawer-icon-btn"
                    onClick={replayConversation}
                  >
                    <ReplayIcon /> Replay
                  </button>
                  <button
                    className="drawer-action-btn drawer-icon-btn"
                    onClick={downloadConversation}
                  >
                    <DownloadIcon /> Download
                  </button>
                </div>
              </div>

              {/* Desktop side buttons */}
              <div className="side-actions">
                <button
                  className="side-action-btn pause-side-btn"
                  onClick={togglePause}
                  title={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? <PlayIcon /> : <PauseIcon />}
                </button>
                <button
                  className="side-action-btn replay-side-btn"
                  onClick={replayConversation}
                  title="Replay"
                >
                  <ReplayIcon />
                </button>
                <button
                  className="side-action-btn download-side-btn"
                  onClick={downloadConversation}
                  title="Download"
                >
                  <DownloadIcon />
                </button>
              </div>
            </>
          )}

          <div className="grid-wrapper">
            <ChromaGrid
              items={gridItems}
              radius={340}
              columns={Math.min(5, gridItems.length)}
              rows={Math.ceil(gridItems.length / 5)}
              selectedPersonaId={speakingCharacterId}
            />
          </div>

          {conversationStarted && (
            <div className="dialogue-display">
              {story?.dialogue.map((line, index) => {
                const character = story.characters.find(
                  (c) => c.id === line.characterId
                );
                const isActive = index === currentDialogueIndex;
                const hasPlayed = index < currentDialogueIndex;

                return (
                  <div
                    key={index}
                    className={`dialogue-line ${isActive ? "active" : ""} ${
                      hasPlayed ? "played" : ""
                    }`}
                  >
                    <span className="character-name">
                      {character?.name} ({line.characterId}):
                    </span>{" "}
                    <span className="dialogue-text">{line.text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

