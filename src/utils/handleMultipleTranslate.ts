export async function handleMultiTranslate(
  texts: string[],
  target: string
): Promise<string[]> {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("No texts provided for translation.");
  }

  if (!target) {
    throw new Error("Target language is required.");
  }

  try {
    const results = await Promise.all(
      texts.map(async (text, index) => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/translate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: text, target }),
          });

          if (!response.ok) {
            console.warn(`Translation failed for item ${index + 1}: HTTP ${response.status}`);
            return "";
          }

          const data = await response.json();
          return data?.data?.translations?.[0]?.translatedText ?? "";
        } catch (innerErr) {
          console.error(`Error translating item ${index + 1}:`, innerErr);
          return ""; // Return empty string for failed item instead of rejecting all
        }
      })
    );

    return results;
  } catch (err) {
    console.error("Batch translation failed:", err);
    throw err;
  }
}
