import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage/LandingPage';
import { ConversationPage } from './pages/ConversationPage/ConversationPage';
import { PostHogPageView } from './components/PostHogPageView/PostHogPageView';
import "./App.css";

function App() {
  return (
    <Router>
      <PostHogPageView />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/interview" element={<ConversationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
