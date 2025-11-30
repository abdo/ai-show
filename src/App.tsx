import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage/LandingPage';
import { TheatrePage } from './pages/TheatrePage/TheatrePage';
import { ConversationPage } from './pages/ConversationPage/ConversationPage';
import { PostHogPageView } from './components/PostHogPageView/PostHogPageView';
import "./App.css";

function App() {
  return (
    <Router>
      <PostHogPageView />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/theatre" element={<TheatrePage />} />
        <Route path="/talk" element={<ConversationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
