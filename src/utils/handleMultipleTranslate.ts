export async function handleMultiTranslate(
  texts: string[],
  target: string
): Promise<string[]> {
  try {
    const results = await Promise.all(
      texts.map(async (text) => {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: text, target }),
        });

        const data = await response.json();
        return data?.data?.translations?.[0]?.translatedText || "";
      })
    );

    return results;
  } catch (err) {
    console.error("Batch translation failed:", err);
    throw err;
  }
}
