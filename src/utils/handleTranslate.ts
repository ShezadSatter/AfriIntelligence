// src/utils/handleTranslate.ts
export async function handleTranslate() {
  const input = (document.getElementById("inputText") as HTMLTextAreaElement)?.value;
  const target = (document.getElementById("language") as HTMLSelectElement)?.value;
  const button = document.getElementById("translateBtn") as HTMLButtonElement;

  if (!target || !input) {
    alert("Please select a language and enter text.");
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Translating...";
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: input, target }),
    });

    const data = await response.json();
    const translated = data?.data?.translations?.[0]?.translatedText || "";

    const outputEl = document.getElementById("outputText") as HTMLTextAreaElement;
    if (outputEl) outputEl.value = translated;
  } catch (err: any) {
    console.error("Translation failed:", err.message);
    alert("Translation failed. See console for details.");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Translate";
    }
  }
}
