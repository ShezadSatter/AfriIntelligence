import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SelectionPage from "./pages/selection";
import TranslateDocument from "./pages/translateDocument";
import TTSPage from "./pages/tts"; // if available

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SelectionPage />} />
        <Route path="/translate-document" element={<TranslateDocument />} />
        <Route path="/tts" element={<TTSPage />} />
      </Routes>
    </Router>
  );
}

export default App;