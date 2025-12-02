import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../../components/Logo/Logo";
import { Footer } from "../../components/Footer/Footer";
import { JobAutocomplete } from "../../components/JobAutocomplete/JobAutocomplete";
import "./LandingPage.css";
import theatreImage from "../../assets/theatre.webp";

export function LandingPage() {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleStartInterview = () => {
    if (selectedJob) {
      navigate(`/interview?role=${encodeURIComponent(selectedJob)}`);
    }
  };

  return (
    <main className="landing-page">
      {/* Hero Section with Job Input */}
      <header className="hero-section">
        <div className="logo-container">
          <Logo />
        </div>
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
          <p className="hero-tagline">Practice interviews that feel real</p>
          
          {/* Job Selection in Hero */}
          <div className="hero-input-section">
            <h1 className="hero-input-title">What role are you interviewing for?</h1>
            
            <div className="hero-input-wrapper">
              <JobAutocomplete
                onSelect={(job) => setSelectedJob(job || null)}
                placeholder="e.g., Software Engineer, Cult Leader..."
              />
              
              <button
                className="hero-submit-button"
                onClick={handleStartInterview}
                disabled={!selectedJob}
                aria-label="Start interview"
              >
                Start Interview <span aria-hidden="true">🎤</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Introduction Section */}
      <section className="intro-section" aria-label="About the platform">
        <div className="intro-container">
          <h2 className="intro-title">Interview Practice, Reimagined</h2>
          <p className="intro-description">
            Practice technical interviews with an expert AI interviewer who adapts to your role.
            Experience realistic interview scenarios with real-time voice conversation, get personalized questions
            tailored to your position, and receive honest, constructive feedback to improve your performance.
          </p>
          
          <div className="features-section">
            <div className="feature-card">
              <span className="feature-icon">💡</span>
              <h3 className="feature-title">Role-Specific Questions</h3>
              <p className="feature-description">
                90 technical questions tailored to your exact role
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🗣️</span>
              <h3 className="feature-title">Voice Conversation</h3>
              <p className="feature-description">
                Real-time voice chat for authentic interview experience
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📊</span>
              <h3 className="feature-title">Honest Feedback</h3>
              <p className="feature-description">
                Get constructive feedback on your performance
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
