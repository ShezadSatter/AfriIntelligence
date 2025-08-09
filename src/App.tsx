import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SelectionPage from "./pages/SelectionPage";
import TranslateDocument from "./pages/TranslateDocument";
import TextToSpeech from "./pages/TextToSpeech";
import HomePage from "./pages/HomePage";
import GlossaryPage from "./pages/GlossaryPage"; 


import { handleTranslate } from "./utils/handleTranslate";
import { translatePage } from "./utils/translatePage";
import { initFileUpload } from "./utils/fileUploadHandler";
import { initSpeech } from "./utils/speechHandler";
import { fetchSubjectList } from "./utils/glossaryApi";


const App: React.FC = () => {
  useEffect(() => {
    (window as any).handleTranslate = handleTranslate;
  }, []);

  useEffect(() => {
    const dropdown = document.querySelector(".lang_dropdown") as HTMLSelectElement;
    if (!dropdown) return;

    const onChange = (e: Event) => {
      const lang = (e.target as HTMLSelectElement).value;
      translatePage(lang);
    };

    dropdown.addEventListener("change", onChange);
    return () => dropdown.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    initFileUpload();
  }, []);

  useEffect(() => {
    const cleanupSpeech = initSpeech();
    return cleanupSpeech;
  }, []);

  useEffect(() => {
  fetchSubjectList(); // You can cache/store it globally or in context
}, []);


  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/selection" element={<SelectionPage />} />
        <Route path="/tts" element={<TextToSpeech />} />
        <Route path="/translate" element={<TranslateDocument />} />
        <Route path="/glossary" element={<GlossaryPage />} />

      </Routes>
    </Router>
  );
};

export default App;
