// src/utils/translatePage.ts
export async function translatePage(targetLang: string) {
  const elements = document.querySelectorAll("[data-i18n]");

  for (const el of elements) {
    const originalText = el.getAttribute("data-original") || el.textContent?.trim();
    if (!originalText) continue;

    el.setAttribute("data-original", originalText);

    try {
      const response = await fetch("https://afri-intelligence.onrender.com/translate", {
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
}
