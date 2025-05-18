import React, { useEffect, useState } from "react";
import "./styles.css";

const TextToSpeech = () => {
  const [language, setLanguage] = useState("zu");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => setVoices(speechSynthesis.getVoices());
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }, []);

  const handleTranslate = async () => {
    if (!inputText || !language) {
      alert("Please select a language and enter text.");
      return;
    }

    try {
      const response = await fetch(
        "https://afri-intelligence.onrender.com/translate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: inputText, target: language }),
        }
      );

      if (!response.ok) throw new Error("Translation failed");

      const data = await response.json();
      const translated = data?.data?.translations?.[0]?.translatedText || "";
      setOutputText(translated);
    } catch (err) {
      console.error(err);
      alert("Translation failed.");
    }
  };

  const handleSpeak = () => {
    if (!outputText) return;

    const utterance = new SpeechSynthesisUtterance(outputText);
    utterance.rate = 0.5;
    utterance.pitch = 1;
    utterance.volume = 1;

    const fallbackVoice =
      voices.find((v) => v.lang.startsWith("en-ZA")) || voices[0];
    if (fallbackVoice) utterance.voice = fallbackVoice;

    speechSynthesis.speak(utterance);
  };

  return (
    <div className="container">
      <img className="background-img" src="/src/assets/images/bg3.png" />
      <div className="header">
        <img className="app-icon" src="/src/assets/images/logo.jpg" />
        <div className="title">Exam Paper Translator</div>
        <div className="underline"></div>
      </div>

      <div className="main-card">
        <div className="section-label">Text - To - Speech</div>

        <div className="language-selector">
          <label htmlFor="language">Select Target Language:</label>
          <select
            id="language"
            className="lang-drop"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="zu">Zulu</option>
            <option value="xh">Xhosa</option>
            <option value="st">Sesotho</option>
            <option value="en">English</option>
          </select>
        </div>

        <textarea
          id="inputText"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to translate..."
        ></textarea>

        <button onClick={handleTranslate}>Translate</button>

        <textarea
          id="outputText"
          value={outputText}
          readOnly
          placeholder="Translation will appear here..."
        ></textarea>

        <button onClick={handleSpeak}>Speak</button>
      </div>
    </div>
  );
};

export default TextToSpeech;
