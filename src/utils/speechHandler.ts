// src/utils/speechHandler.ts
export function initSpeech() {
  const speakBtn = document.getElementById("speakBtn");
  let voices: SpeechSynthesisVoice[] = [];

  const loadVoices = () => {
    voices = speechSynthesis.getVoices();
  };

  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  const getFallbackVoice = (voices: SpeechSynthesisVoice[], langCode: string) => {
    const langMap: Record<string, string[]> = {
      zu: ["en-ZA"],
      xh: ["en-ZA"],
      st: ["en-ZA"],
      en: ["en-US"],
    };

    const preferred = langMap[langCode] || ["en-US"];
    for (const code of preferred) {
      const match = voices.find((v) => v.lang.toLowerCase().startsWith(code.toLowerCase()));
      if (match) return match;
    }

    return voices[0];
  };

  const handleSpeak = () => {
    const output = document.getElementById("outputText") as HTMLTextAreaElement;
    if (!output || !output.value) return;

    const utterance = new SpeechSynthesisUtterance(output.value);
    utterance.rate = 0.5;
    utterance.pitch = 1;
    utterance.volume = 1;

    const selectedLang = (document.getElementById("language") as HTMLSelectElement)?.value || "en";
    utterance.voice = getFallbackVoice(voices, selectedLang);

    speechSynthesis.speak(utterance);
  };

  speakBtn?.addEventListener("click", handleSpeak);

  return () => {
    speakBtn?.removeEventListener("click", handleSpeak);
  };
}
