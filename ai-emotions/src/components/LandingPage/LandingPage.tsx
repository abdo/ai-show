import { useState } from "react";
import "./LandingPage.css";
import theatreImage from "../../assets/theatre.webp";

type LandingPageProps = {
  onStartStory: (userInput: string) => void;
};

const examplePrompts = [
  "Should I confront my friend who keeps canceling plans?",
  "I found out my coworker earns more than me for the same role.",
  "My parents don't support my career change to art.",
  "My partner wants kids but I'm not sure if I do.",
  "I saw my best friend's partner cheating on them.",
];

export function LandingPage({ onStartStory }: LandingPageProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (text: string) => {
    if (text.trim()) {
      onStartStory(text.trim());
    }
  };

  return (
    <div className="landing-page">
      {/* Hero Section with Theatre Spotlight */}
      <div className="hero-section">
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
          >
            Create Your Show
            <span className="cta-arrow">👇</span>
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="input-section">
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
              placeholder="Describe what you're thinking about..."
              rows={4}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  handleSubmit(input);
                }
              }}
            />
            <button
              className="submit-button"
              onClick={() => handleSubmit(input)}
              disabled={!input.trim()}
            >
              Start the Show 👉
            </button>
          </div>

          <div className="examples-section">
            <p className="examples-label">or explore:</p>
            <div className="examples-grid">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="example-button"
                  onClick={() => handleSubmit(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
