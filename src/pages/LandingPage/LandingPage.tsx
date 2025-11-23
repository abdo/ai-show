import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModeSwitch } from "../../components/ModeSwitch/ModeSwitch";
import "./LandingPage.css";
import theatreImage from "../../assets/theatre.webp";

const examplePrompts = [
  "Should I confront my friend who keeps canceling plans?",
  "I found out my coworker earns more than me for the same role.",
  "My parents don't support my career change to art.",
  "My partner wants kids but I'm not sure if I do.",
  "I saw my best friend's partner cheating on them.",
];

export function LandingPage() {
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [isConversationMode, setIsConversationMode] = useState(false); // Story mode is default (right/checked)
  const navigate = useNavigate();

  // Load saved name from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName) {
      setName(savedName);
    }
  }, []);

  const handleSubmit = (text: string) => {
    if (text.trim()) {
      const finalName = name.trim();
      
      // Save name to localStorage if provided
      if (finalName) {
        localStorage.setItem("userName", finalName);
      }
      
      navigate("/theatre", { 
        state: { 
          topic: text.trim(),
          name: finalName || undefined,
          mode: isConversationMode ? 'conversation' : 'story'
        } 
      });
    }
  };

  return (
    <main className="landing-page">
      {/* Hero Section with Theatre Spotlight */}
      <header className="hero-section">
        <div className="theatre-background">
          <img className="theatre-img" src={theatreImage} alt="Theatre stage" />
          <div className="light1">
            <div className="ray"></div>
          </div>
          <div className="light2">
            <div className="ray"></div>
          </div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="title-main">AI Show</span>
            <span className="title-tagline">Where perspectives come alive</span>
          </h1>
          <p className="hero-description">
            Turn any situation into a cinematic conversation. Watch as AI
            characters debate, connect, and challenge each other with distinct
            voices and personalities.
          </p>
          <button
            className="hero-cta"
            onClick={() => {
              document
                .querySelector(".input-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            aria-label="Scroll to create your show"
          >
            Create Your Show
            <span className="cta-arrow" aria-hidden="true">👇</span>
          </button>
        </div>
      </header>

      {/* Input Section */}
      <section className="input-section" aria-label="Create your story">
        <div className="input-container">
          <h2 className="input-title">What's your story?</h2>
          <p className="input-subtitle">
            Share a situation, dilemma, or moment. We'll create a conversation
            exploring it from different angles.
          </p>

          <div className="input-wrapper">
            <textarea
              className="story-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="I've been working at my company for five years, and I just found out that my younger colleague, who joined last year, is making more than me..."
              rows={4}
              aria-label="Your story input"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  handleSubmit(input);
                }
              }}
            />
            
            <div className="name-input-wrapper">
              <input
                type="text"
                className="name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                aria-label="Your name (optional)"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    handleSubmit(input);
                  }
                }}
              />
              <span className="optional-label">(optional)</span>
            </div>
            
            <button
              className="submit-button"
              onClick={() => handleSubmit(input)}
              disabled={!input.trim()}
              aria-label="Start the show"
            >
              Start the Show <span aria-hidden="true">🎭</span>
            </button>
            
            <ModeSwitch
              isConversationMode={isConversationMode}
              onToggle={setIsConversationMode}
            />
          </div>

          <div className="examples-section">
            <p className="examples-label">or try:</p>
            <div className="examples-grid" role="list">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="example-button"
                  onClick={() => handleSubmit(prompt)}
                  role="listitem"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
