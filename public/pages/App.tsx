import React, { useEffect } from "react";

const App: React.FC = () => {
  // Removed unused selectedLanguage state
  // Removed unused inputText state
  // Removed unused translatedText state
  // Removed unused isLoading state

  useEffect(() => {
    (window as any).handleTranslate = async () => {
      const input = (
        document.getElementById("inputText") as HTMLTextAreaElement
      )?.value;
      const target = (document.getElementById("language") as HTMLSelectElement)
        ?.value;
      const button = document.getElementById(
        "translateBtn"
      ) as HTMLButtonElement;

      if (!target || !input) {
        alert("Please select a language and enter text.");
        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent = "Translating...";
      }

      try {
        const response = await fetch(
          "https://afri-intelligence.onrender.com/api/translate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: input, target }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Backend error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const translated = data?.data?.translations?.[0]?.translatedText || "";

        const outputEl = document.getElementById(
          "outputText"
        ) as HTMLTextAreaElement;
        if (outputEl) outputEl.value = translated;
      } catch (error: any) {
        console.error("Translation failed:", error.message);
        alert("Translation failed. See console for details.");
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = "Translate";
        }
      }
    };
  }, []);

  const translatePage = async (targetLang: string) => {
    const elements = document.querySelectorAll("[data-i18n]");

    for (const el of elements) {
      const originalText =
        el.getAttribute("data-original") || el.textContent?.trim();
      if (!originalText) continue;

      // Save the original text once
      el.setAttribute("data-original", originalText);

      try {
        const response = await fetch(
          "https://afri-intelligence.onrender.com/translate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: originalText, target: targetLang }),
          }
        );

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

  useEffect(() => {
    const dropdown = document.querySelector(
      ".lang_dropdown"
    ) as HTMLSelectElement;
    if (!dropdown) return;

    const handleLangChange = (e: Event) => {
      const lang = (e.target as HTMLSelectElement).value;
      translatePage(lang);
    };

    dropdown.addEventListener("change", handleLangChange);

    return () => {
      dropdown.removeEventListener("change", handleLangChange);
    };
  }, []);

  const form = document.getElementById("uploadForm");
  const loadingOverlay = document.getElementById("loadingOverlay");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (loadingOverlay) {
        loadingOverlay.style.display = "block"; // Show overlay
      }

      const formData = new FormData(form as HTMLFormElement);
      try {
        const res = await fetch(
          "https://afri-intelligence.onrender.com/translate-file",
          {
            method: "POST",
            body: formData,
          }
        );

        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "translated.docx";
          a.click();
          window.URL.revokeObjectURL(url);

          const status = document.getElementById("translationStatus");
          if (status) {
            status.textContent = "Translation complete!";
            status.style.color = "#236738"; // green or theme color
            status.style.display = "block";
          }
        } else {
          alert("Translation failed");
        }
      } catch (err) {
        alert("Something went wrong. Check console.");
        console.error(err);
      } finally {
        if (loadingOverlay) {
          loadingOverlay.style.display = "none"; // Hide overlay
        }
      }
    });
  }

  useEffect(() => {
    const speakBtn = document.getElementById("speakBtn");
    let voices: SpeechSynthesisVoice[] = [];

    const loadVoices = () => {
      voices = speechSynthesis.getVoices();
    };

    // Some browsers delay voice loading
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    loadVoices(); // Try loading immediately too

    const getFallbackVoice = (
      voices: SpeechSynthesisVoice[],
      langCode: string
    ) => {
      const langMap: Record<string, string[]> = {
        zu: ["en-ZA"], // No Zulu? Use English South Africa or UK
        xh: ["en-ZA"],
        st: ["en-ZA"],
        en: ["en-US"],
      };

      const preferredLangs = langMap[langCode] || ["en-US"];

      for (const code of preferredLangs) {
        const match = voices.find((v) =>
          v.lang.toLowerCase().startsWith(code.toLowerCase())
        );
        if (match) return match;
      }

      return voices[0]; // Absolute fallback
    };

    const handleSpeak = () => {
      const outputTextEl = document.getElementById(
        "outputText"
      ) as HTMLTextAreaElement;
      if (!outputTextEl || !outputTextEl.value) return;

      const utterance = new SpeechSynthesisUtterance(outputTextEl.value);

      // speech rate (1.0 is normal, 0.5 is slower)
      utterance.rate = 0.5;

      // pitch and volume
      utterance.pitch = 1; // Normal pitch
      utterance.volume = 1; // Max volume

      // Get available voices
      const selectedLang =
        (document.getElementById("language") as HTMLSelectElement)?.value ||
        "en";

      const fallbackVoice = getFallbackVoice(voices, selectedLang);

      if (fallbackVoice) {
        utterance.voice = fallbackVoice;
      }

      speechSynthesis.speak(utterance);
    };

    speakBtn?.addEventListener("click", handleSpeak);

    return () => {
      speakBtn?.removeEventListener("click", handleSpeak);
    };
  }, []);

  return null;
};

export default App;
