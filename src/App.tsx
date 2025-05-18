// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import SelectionPage from "./components/SelectionPage";
import TranslateDocumentPage from "./components/TranslateDocumentPage";
import TTSPage from "./components/TTSPage";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<SelectionPage />} />
      <Route path="/translate" element={<TranslateDocumentPage />} />
      <Route path="/tts" element={<TTSPage />} />
    </Routes>
  );
};

export default App;
