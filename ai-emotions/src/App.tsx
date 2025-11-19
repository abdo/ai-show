import { useEffect, useMemo, useState } from "react";
import ChromaGrid from "./components/ChromaGrid";
import { LandingPage } from "./components/LandingPage/LandingPage";
import "./App.css";
import { usePerspectives } from "./hooks/usePerspectives";
import { usePersonaVoices } from "./hooks/usePersonaVoices";

function App() {
  const [userTopic, setUserTopic] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const { story, fetchStory, isLoading, error } = usePerspectives();

  const {
    generateAllVoices,
    playAllDialogue,
    stopAudio,
    unlockAudio,
    isGenerating,
    currentDialogueIndex,
  } = usePersonaVoices();

  const handleStartStory = async (topic: string) => {
    if (!topic.trim()) return;
    unlockAudio();
    setUserTopic(topic);
    setHasSubmitted(true);
    fetchStory(topic);
  };

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
      subtitle: "", // Don't reveal the role to the user beforehand
      handle: `@${char.id}`,
      borderColor: char.borderColor,
      gradient: char.gradient,
      url: "",
    }));
  }, [story]);

  const [conversationStarted, setConversationStarted] = useState(false);

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

  const allVoicesReady = useMemo(() => {
    if (!story || isGenerating) return false;
    return story.dialogue.length > 0;
  }, [story, isGenerating]);

  // Get the character currently speaking
  const speakingCharacterId = useMemo(() => {
    if (currentDialogueIndex === -1 || !story) return null;
    return story.dialogue[currentDialogueIndex]?.characterId || null;
  }, [currentDialogueIndex, story]);

  return (
    <div className="app">
      {!hasSubmitted && <LandingPage onStartStory={handleStartStory} />}

      {hasSubmitted && (
        <div className="results-stage">
          <button
            className="back-arrow-btn"
            onClick={() => {
              stopAudio();
              setConversationStarted(false);
              setHasSubmitted(false);
              setUserTopic("");
            }}
            aria-label="Go back"
          >
            ← Back
          </button>

          {conversationStarted && (
            <div className="theatre-lights">
              <div className="light1">
                <div className="ray"></div>
              </div>
              <div className="light2">
                <div className="ray"></div>
              </div>
            </div>
          )}
          <div className="results-header">
            <p className="scenario-text">"{userTopic}"</p>
            <div className="status-line">
              {isLoading && (
                <span className="status">Writing the scene...</span>
              )}
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
              {!conversationStarted && (
                <button className="play-story-btn" onClick={startConversation}>
                  ▶ Play the conversation
                </button>
              )}

              {conversationStarted && (
                <button className="replay-btn" onClick={replayConversation}>
                  🔁 Replay
                </button>
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
                          {character?.name}:
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
      )}
    </div>
  );
}

export default App;
