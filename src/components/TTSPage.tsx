// src/components/TTSPage.tsx
import React, { useEffect } from "react";
import "../pages/styles.css"; // or the equivalent CSS

const TTSPage: React.FC = () => {
  useEffect(() => {
    (window as any).handleTranslate = async () => {
      const input = document.getElementById("inputText") as HTMLTextAreaElement;
      const target = document.getElementById("language") as HTMLSelectElement;
      const output = document.getElementById("outputText") as HTMLTextAreaElement;

      if (!input || !target || !output) return;

      const button = document.getElementById("translateBtn") as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = "Translating...";
      }

      try {
        const response = await fetch("https://afri-intelligence.onrender.com/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: input.value, target: target.value }),
        });

        const data = await response.json();
        output.value = data?.data?.translations?.[0]?.translatedText || "";
      } catch (error) {
        alert("Translation failed");
        console.error(error);
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = "Translate";
        }
      }
    };

    const speakBtn = document.getElementById("speakBtn");
    let voices: SpeechSynthesisVoice[] = [];

    const loadVoices = () => {
      voices = speechSynthesis.getVoices();
    };

    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    const handleSpeak = () => {
      const outputTextEl = document.getElementById("outputText") as HTMLTextAreaElement;
      if (!outputTextEl || !outputTextEl.value) return;

      const utterance = new SpeechSynthesisUtterance(outputTextEl.value);
      utterance.rate = 0.5;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.voice = voices.find((v) => v.lang.startsWith("en")) || voices[0];
      speechSynthesis.speak(utterance);
    };

    speakBtn?.addEventListener("click", handleSpeak);

    return () => {
      speakBtn?.removeEventListener("click", handleSpeak);
    };
  }, []);

  return (
    <div className="container">
      <img className="background-img" src="/src/assets/images/bg3.png" />
      <div className="header">
        <img className="app-icon" src="/src/assets/images/logo.jpg" />
        <div className="title"><span>Exam Paper Translator</span></div>
        <div className="underline"></div>
      </div>

      <div className="main-card">
        <div className="section-label"><span>Text - To - Speech</span></div>

        <div className="language-selector">
          <label htmlFor="language">Select Target Language:</label>
          <select id="language" className="lang-drop">
            <option value="zu">Zulu</option>
            <option value="xh">Xhosa</option>
            <option value="st">Sesotho</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="label-type">
          <textarea id="inputText" placeholder="Enter text to translate..."></textarea>
        </div>

        <div className="label-translated">
          <button onClick={() => (window as any).handleTranslate()} id="translateBtn">Translate</button>
        </div>

        <div className="label-placeholder">
          <textarea id="outputText" placeholder="Translation will appear here..." readOnly></textarea>
        </div>

        <div className="submit-button">
          <button id="speakBtn">Speak</button>
        </div>
      </div>
    </div>
  );
};

export default TTSPage;
