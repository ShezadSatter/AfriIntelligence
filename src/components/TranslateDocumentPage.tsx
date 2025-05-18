// src/components/TranslateDocumentPage.tsx
import React, { useEffect } from "react";
import "../styles/upload.css";

const TranslateDocumentPage: React.FC = () => {
  useEffect(() => {
    const form = document.getElementById("uploadForm");
    const loadingOverlay = document.getElementById("loadingOverlay");

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (loadingOverlay) {
          loadingOverlay.style.display = "block";
        }

        const formData = new FormData(form as HTMLFormElement);
        try {
          const res = await fetch("https://afri-intelligence.onrender.com/translate-file", {
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
            alert("Translation failed");
          }
        } catch (err) {
          alert("Something went wrong. Check console.");
          console.error(err);
        } finally {
          if (loadingOverlay) {
            loadingOverlay.style.display = "none";
          }
        }
      });
    }
  }, []);

  return (
    <section className="container">
      <div className="title">
        <img src="/assets/images/logo.jpg" alt="logo" />
        <h1>Exam Paper Translation</h1>
        <hr />
      </div>

      <div className="main-card">
        <div className="section-label">Upload Document</div>

        <div id="loadingOverlay">
          <div className="spinner"></div>
          <p>Translating, please wait...</p>
        </div>

        <form id="uploadForm" encType="multipart/form-data">
          <input type="file" name="file" accept=".pdf,.docx" required />
          <select name="target">
            <option value="zu">Zulu</option>
            <option value="xh">Xhosa</option>
            <option value="en">English</option>
          </select>
          <button type="submit" className="submit-button">
            <div className="inner-button">Translate</div>
          </button>
        </form>

        <div className="file-icon">
          <div className="folded-corner">
            <div id="translationStatus" className="translation-status"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TranslateDocumentPage;
