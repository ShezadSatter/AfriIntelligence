// src/utils/translatePage.ts
export async function translatePage(targetLang: string) {
  const elements = document.querySelectorAll<HTMLElement>("[data-i18n]");

  // Collect translation promises to run in parallel
  const translationPromises = Array.from(elements).map(async (el) => {
    // Use stored original text if present; otherwise, get current text content
    let originalText = el.getAttribute("data-original");
    if (!originalText) {
      originalText = el.textContent?.trim() || "";
      if (!originalText) return;
      el.setAttribute("data-original", originalText);
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: originalText, target: targetLang }),
      });

      if (!response.ok) {
        console.error(`Failed to translate: ${originalText}`);
        return;
      }

      const data = await response.json();
      const translated = data?.data?.translations?.[0]?.translatedText;

      if (translated) {
        el.textContent = translated;
      }
    } catch (error) {
      console.error("Translation failed:", error);
    }
  });

  // Wait for all translations to complete
  await Promise.all(translationPromises);
}
