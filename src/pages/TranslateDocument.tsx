import React, { useEffect, useRef, useState } from "react";
import "./upload.css";

const TranslateDocument: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  useEffect(() => {
    const form = formRef.current;
if (!form) return;


    const handleSubmit = async (e: Event) => {
      e.preventDefault();
      setLoading(true);

      if (overlayRef.current) {
        overlayRef.current.style.display = "block";
      }

const formData = new FormData(form as HTMLFormElement);

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/translate-file`,
          {
            method: "POST",
            body: formData,
          }
        );

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
          alert("Translation failed. Please try again.");
        }
      } catch (err) {
        console.error("Translation error:", err);
        alert(
          "Something went wrong. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
        if (overlayRef.current) {
          overlayRef.current.style.display = "none";
        }
      }
    };

form?.addEventListener("submit", handleSubmit);
return () => form?.removeEventListener("submit", handleSubmit);
  }, []);

  return (
    <div className="container">
      <img
        className="background-img"
        src="/assets/images/bg3.png"
        alt="Background"
      />

      <div className="header">
        <img className="app-icon" src="/assets/images/logo.png" alt="Logo" />
        <div data-i18n className="title">
          <span>Exam Paper Translator</span>
        </div>
        <div className="underline"></div>
      </div>
      <div className="main-card">
        <div className="section-label">Upload Document</div>

        <div id="loadingOverlay" ref={overlayRef}>
          <div className="spinner"></div>
          <p>Translating, please wait...</p>
        </div>

        <form id="uploadForm" ref={formRef} encType="multipart/form-data">


         <div className="form-controls">

 <select name="target" required>
            <option value="">Select language</option>
            <option value="zu">Zulu</option>
            <option value="xh">Xhosa</option>
            <option value="en">English</option>
          </select>

          <div className="custom-file-input">
            <label htmlFor="file-upload">Choose File</label>
            <span id="file-name">{fileName || "No file chosen"}</span>
            <input
              type="file"
              id="file-upload"
              name="file"
              accept=".pdf,.docx"
              required
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </div>

         

          

          <div className="file-icon">
          <div
            className="translation-status"
            ref={statusRef}
            id="translationStatus"
          ></div>
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
            <div className="inner-button">
              {loading ? "Processing..." : "Translate"}
            </div>
          </button>
          </div>
        </form>

        
      </div>
    </div>
  );
};

export default TranslateDocument;
