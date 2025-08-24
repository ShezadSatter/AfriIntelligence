import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SelectionPage from "./pages/SelectionPage";
import TranslateDocument from "./pages/TranslateDocument";
import TextToSpeech from "./pages/TextToSpeech";
import HomePage from "./pages/HomePage";
import GlossaryPage from "./pages/GlossaryPage";
import PastPapersPage from "./pages/PastPapersPage";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import { UserContextProvider } from "../context/userContext"; // add .tsx extension for Node ESM
import "./styles/styles.css";
import TeacherDashboard from "./pages/TeacherDashboard";

import { handleTranslate } from "./utils/handleTranslate";
import { translatePage } from "./utils/translatePage";
import { initFileUpload } from "./utils/fileUploadHandler";
import { initSpeech } from "./utils/speechHandler";
import { fetchSubjectList } from "./utils/glossaryApi";

axios.defaults.baseURL = "http://localhost:3000";
axios.defaults.withCredentials = true;

const App: React.FC = () => {
  useEffect(() => {
    (window as any).handleTranslate = handleTranslate;
  }, []);

  useEffect(() => {
    const dropdown = document.querySelector(
      ".lang_dropdown"
    ) as HTMLSelectElement;
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
      <UserContextProvider>
        <Navbar />

        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

        <Routes>
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/selection" element={<SelectionPage />} />
          <Route path="/tts" element={<TextToSpeech />} />
          <Route path="/translate" element={<TranslateDocument />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/past-papers" element={<PastPapersPage />} />
            <Route path="/" element={<Home />} />

          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        </Routes>
      </UserContextProvider>
    </Router>
  );
};

export default App;
