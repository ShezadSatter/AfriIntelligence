// src/utils/speechHandler.ts
export function initSpeech() {
  const speakBtn = document.getElementById("speakBtn");
  let voices: SpeechSynthesisVoice[] = [];

  // Load voices, fallback if not ready yet
  const loadVoices = () => {
    voices = speechSynthesis.getVoices();
    if (!voices.length) {
      // Some browsers might not populate voices immediately
      setTimeout(() => {
        voices = speechSynthesis.getVoices();
      }, 100);
    }
  };

  // Event for when voices change (on some browsers)
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  // Map language codes to fallback voice language tags
  const getFallbackVoice = (voices: SpeechSynthesisVoice[], langCode: string) => {
    const langMap: Record<string, string[]> = {
      zu: ["en-ZA"], // Zulu fallback English South Africa
      xh: ["en-ZA"], // Xhosa fallback
      st: ["en-ZA"], // Southern Sotho fallback
      en: ["en-US"], // English fallback US
    };

    const preferred = langMap[langCode] || ["en-US"];
    for (const code of preferred) {
      const match = voices.find((v) => v.lang.toLowerCase().startsWith(code.toLowerCase()));
      if (match) return match;
    }

    // If no preferred voice, return first available voice or null
    return voices.length > 0 ? voices[0] : null;
  };

  const handleSpeak = () => {
    const output = document.getElementById("outputText") as HTMLTextAreaElement | null;
    if (!output || !output.value) return;

    if (speechSynthesis.speaking) {
      // If already speaking, optionally cancel and start over
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(output.value);
    utterance.rate = 0.5;  // Slow down for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    const selectedLang = (document.getElementById("language") as HTMLSelectElement)?.value || "en";
    const voice = getFallbackVoice(voices, selectedLang);
    if (voice) {
      utterance.voice = voice;
    }

    speechSynthesis.speak(utterance);
  };

  speakBtn?.addEventListener("click", handleSpeak);

  // Return a cleanup function to remove event listener if needed
  return () => {
    speakBtn?.removeEventListener("click", handleSpeak);
  };
}
