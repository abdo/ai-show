import { FormEvent, useEffect, useMemo, useState } from "react"
import ChromaGrid from "./components/ChromaGrid"
import "./App.css"
import { usePerspectives } from "./hooks/usePerspectives"
import type { PersonaPerspective } from "./hooks/usePerspectives"
import { usePersonaVoices } from "./hooks/usePersonaVoices"

const suggestionExamples = [
  "My teammate took credit for a feature I built.",
  "I had to cancel dinner on a close friend last-minute.",
  "A stranger helped me when my car broke down on the highway.",
]

function App() {
  const [input, setInput] = useState("")
  const [scenario, setScenario] = useState("")
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const { personas, fetchPerspectives, isLoading, error } = usePerspectives()
  const { generateVoices, playVoice, unlockAudio, voiceStatus } =
    usePersonaVoices()

  const handleSubmit = async (value?: string) => {
    const story = (value ?? input).trim()
    if (!story) return
    unlockAudio()
    setScenario(story)
    await fetchPerspectives(story)
    setHasSubmitted(true)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleSubmit()
  }

  useEffect(() => {
    if (!personas.length || !scenario) return
    generateVoices(
      personas.map((persona) => ({
        id: persona.id,
        opinion: persona.opinion,
        voiceId: persona.voiceId,
      }))
    )
  }, [generateVoices, personas, scenario])

  const gridItems = useMemo(
    () =>
      personas.map((persona) => ({
        ...persona,
      })),
    [personas]
  )

  const voicesReady = useMemo(
    () =>
      personas.every(
        (persona) => voiceStatus[persona.id]?.status === "ready"
      ),
    [personas, voiceStatus]
  )

  return (
    <div className="app">
      {!hasSubmitted && (
        <div className="input-stage">
          <div className="input-container">
            <h1 className="main-title">What happened?</h1>
            <p className="subtitle">
              Share a moment. We'll show you how different people might see it.
            </p>
            
            <form className="input-form" onSubmit={onSubmit}>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="My manager announced my idea as if it were theirs during the all-hands meeting..."
                rows={5}
                className="main-input"
                autoFocus
              />
              
              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? "Gathering perspectives..." : "Get perspectives →"}
              </button>
            </form>

            <div className="examples">
              <span className="examples-label">or try:</span>
              <div className="examples-list">
                {suggestionExamples.map((example) => (
                  <button
                    type="button"
                    key={example}
                    className="example-btn"
                    onClick={() => handleSubmit(example)}
                    disabled={isLoading}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {hasSubmitted && (
        <div className="results-stage">
          <div className="results-header">
            <p className="scenario-text">"{scenario}"</p>
            <div className="status-line">
              {isLoading && <span className="status">Collecting viewpoints...</span>}
              {!isLoading && !voicesReady && (
                <span className="status">Warming up voices...</span>
              )}
              {!isLoading && voicesReady && (
                <span className="status-ready">Hover a persona to hear their take</span>
              )}
            </div>
          </div>

          <div className="grid-wrapper">
            <ChromaGrid
              items={gridItems}
              radius={340}
              columns={3}
              rows={2}
              onCardEnter={(item) => playVoice(item.id)}
            />
          </div>

          <button
            className="new-scenario-btn"
            onClick={() => {
              setHasSubmitted(false)
              setInput("")
              setScenario("")
            }}
          >
            Try another scenario
          </button>
        </div>
      )}
    </div>
  )
}

export default App
