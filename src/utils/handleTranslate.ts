export async function handleTranslate() {
  const inputEl = document.getElementById("inputText") as HTMLTextAreaElement | null;
  const targetEl = document.getElementById("language") as HTMLSelectElement | null;
  const button = document.getElementById("translateBtn") as HTMLButtonElement | null;
  const outputEl = document.getElementById("outputText") as HTMLTextAreaElement | null;

  if (!inputEl || !targetEl || !button || !outputEl) {
    console.error("Missing one or more required elements.");
    return;
  }

  const input = inputEl.value.trim();
  const target = targetEl.value;

  if (!target || !input) {
    alert("Please select a language and enter text.");
    return;
  }

  button.disabled = true;
  button.textContent = "Translating...";

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: input, target }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const translated = data?.data?.translations?.[0]?.translatedText ?? "";

    outputEl.value = translated || "No translation returned.";
  } catch (err: any) {
    console.error("Translation failed:", err);
    alert("Translation failed. See console for details.");
  } finally {
    button.disabled = false;
    button.textContent = "Translate";
  }
}
