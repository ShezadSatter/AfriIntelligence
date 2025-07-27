export function initFileUpload() {
  const form = document.getElementById("uploadForm");
  const loadingOverlay = document.getElementById("loadingOverlay");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (loadingOverlay) loadingOverlay.style.display = "block";

    const formData = new FormData(form as HTMLFormElement);
try{
   const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/translate-file`, {
  method: "POST",
  body: formData,
});

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
          status.style.color = "#236738";
          status.style.display = "block";
        }
      } else {
        alert("Translation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      if (loadingOverlay) loadingOverlay.style.display = "none";
    }
  });
}
