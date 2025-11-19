import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage/LandingPage";
import { TheatrePage } from "./pages/TheatrePage/TheatrePage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/theatre" element={<TheatrePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
