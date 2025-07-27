import React, { useEffect, useRef, useState } from "react";
import "./styles.css";

const TextToSpeech: React.FC = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const langDropdownRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(speechSynthesis.getVoices());
    };

    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    loadVoices();
  }, []);

  const handleTranslate = async () => {
    const input = inputRef.current?.value;
    const target = document.getElementById("language") as HTMLSelectElement;

    if (!target?.value || !input) {
      alert("Please select a language and enter text.");
      return;
    }

    const button = document.getElementById("translateBtn") as HTMLButtonElement;
    if (button) {
      button.disabled = true;
      button.textContent = "Translating...";
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: input, target: target.value }),
      });

      const data = await response.json();
      const translated = data?.data?.translations?.[0]?.translatedText || "";

      if (outputRef.current) outputRef.current.value = translated;
    } catch (error) {
      console.error("Translation failed:", error);
      alert("Translation failed. See console for details.");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Translate";
      }
    }
  };

  const getFallbackVoice = (langCode: string) => {
    const langMap: Record<string, string[]> = {
      zu: ["en-ZA"],
      xh: ["en-ZA"],
      st: ["en-ZA"],
      en: ["en-US"],
    };
    const preferredLangs = langMap[langCode] || ["en-US"];

    for (const code of preferredLangs) {
      const match = voices.find((v) => v.lang.toLowerCase().startsWith(code.toLowerCase()));
      if (match) return match;
    }

    return voices[0]; // fallback
  };

  const handleSpeak = () => {
    const output = outputRef.current?.value;
    if (!output) return;

    const utterance = new SpeechSynthesisUtterance(output);
    utterance.rate = 0.5;
    utterance.pitch = 1;
    utterance.volume = 1;

    const langSelect = document.getElementById("language") as HTMLSelectElement;
    const selectedLang = langSelect?.value || "en";

    const voice = getFallbackVoice(selectedLang);
    if (voice) {
      utterance.voice = voice;
    }

    speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const dropdown = langDropdownRef.current;
    const handleLangChange = (e: Event) => {
      const lang = (e.target as HTMLSelectElement).value;
      translatePage(lang);
    };

    dropdown?.addEventListener("change", handleLangChange);
    return () => dropdown?.removeEventListener("change", handleLangChange);
  }, []);

  const translatePage = async (targetLang: string) => {
    const elements = document.querySelectorAll("[data-i18n]");
    for (const el of elements) {
      const originalText = el.getAttribute("data-original") || el.textContent?.trim();
      if (!originalText) continue;

      el.setAttribute("data-original", originalText);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: originalText, target: targetLang }),
        });

        const data = await response.json();
        const translated = data?.data?.translations?.[0]?.translatedText;

        if (translated) {
          el.textContent = translated;
        }
      } catch (error) {
        console.error("Translation failed:", error);
      }
    }
  };

  return (
    <div className="container">
      <img className="background-img" src="/assets/images/bg3.png" alt="Background" />

      <div className="header">
        <img className="app-icon" src="/assets/images/logo.jpg" alt="Logo" />
        <div data-i18n className="title">
          <span>Exam Paper Translator</span>
        </div>
        <div className="underline"></div>
      </div>

      <div className="main-card">
        <div data-i18n className="section-label">
          <span>Text - To - Speech</span>
        </div>

        <div className="language-selector">
          <label data-i18n htmlFor="language">
            Select Target Language:
          </label>
          <select id="language" className="lang-drop">
            <option value="zu">Zulu</option>
            <option value="xh">Xhosa</option>
            <option value="st">Sesotho</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="label-type">
          <textarea
            id="inputText"
            placeholder="Enter text to translate..."
            data-i18n
            ref={inputRef}
          ></textarea>
        </div>

        <div className="label-translated">
          <button onClick={handleTranslate} id="translateBtn" data-i18n>
            Translate
          </button>
        </div>

        <div className="label-placeholder">
          <textarea
            data-i18n
            id="outputText"
            placeholder="Translation will appear here..."
            readOnly
            ref={outputRef}
          ></textarea>
        </div>

        <div className="submit-button">
          <button id="speakBtn" onClick={handleSpeak}>
            Speak
          </button>
        </div>

        <div className="language-badge">
          <div className="button_cevron">
            <select className="lang_dropdown" ref={langDropdownRef}>
              <option value="en">English</option>
              <option value="af">Afrikaans</option>
              <option value="zu">Zulu</option>
              <option value="st">Sesotho</option>
              <option value="xh">Xhosa</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
