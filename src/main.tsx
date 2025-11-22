import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PostHogProvider } from 'posthog-js/react'
import posthog from 'posthog-js'
import './index.css'
import App from './App.tsx'

// Initialize PostHog if API key exists
const posthogApiKey = import.meta.env.VITE_POSTHOG_API_KEY;
if (posthogApiKey && !posthogApiKey.includes("...")) {
  posthog.init(posthogApiKey, {
    api_host: "https://eu.i.posthog.com",
    person_profiles: 'identified_only',
    debug: true,
  });
}

const isPostHogEnabled = posthogApiKey && !posthogApiKey.includes("...");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPostHogEnabled ? (
      <PostHogProvider client={posthog}>
        <App />
      </PostHogProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)
