import React, { useEffect, useRef, useState } from "react";
import "./upload.css";

const TranslateDocument: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleSubmit = async (e: Event) => {
      e.preventDefault();
      setLoading(true);

      const formData = new FormData(form);

      try {
        const res = await fetch("https://afri-intelligence.onrender.com/translate-file", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "translated.docx";
          a.click();
          URL.revokeObjectURL(url);

          if (statusRef.current) {
            statusRef.current.textContent = "Translation complete!";
            statusRef.current.style.color = "#236738";
            statusRef.current.style.display = "block";
          }
        } else {
          alert("Translation failed.");
        }
      } catch (err) {
        alert("Something went wrong. Check the console.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, []);

  return (
    <>
      <section className="title">
        <img src="/assets/images/logo.jpg" alt="logo" />
        <h1>Exam Paper Translation</h1>
        <hr />
      </section>

      <section className="container">
        <div className="main-card">
          <div className="section-label">Upload Document</div>

          {loading && (
            <div id="loadingOverlay" ref={overlayRef}>
              <div className="spinner"></div>
              <p>Translating, please wait...</p>
            </div>
          )}

          <form id="uploadForm" ref={formRef} encType="multipart/form-data">
            <input
              type="file"
              id="file-upload"
              name="file"
              accept=".pdf,.docx"
              required
            />
            <select name="target" required>
              <option value="zu">Zulu</option>
              <option value="xh">Xhosa</option>
              <option value="en">English</option>
            </select>

            <button type="submit" className="submit-button">
              <div className="inner-button">Translate</div>
            </button>
          </form>

          <div className="file-icon" id="file-icon">
            <div className="folded-corner">
              <div
                id="translationStatus"
                className="translation-status"
                ref={statusRef}
              ></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default TranslateDocument;
