import React, { useState } from "react";
import "/upload.css";

const TranslateDocument: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage("");

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(
        "https://afri-intelligence.onrender.com/translate-file",
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

        setStatusMessage("Translation complete!");
      } else {
        setStatusMessage("Translation failed.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setStatusMessage("Something went wrong. Check console.");
    } finally {
      setLoading(false);
    }
  };

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
            <div id="loadingOverlay">
              <div className="spinner"></div>
              <p>Translating, please wait...</p>
            </div>
          )}

          <form id="uploadForm" onSubmit={handleSubmit}>
            <input
              type="file"
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

          <div className="file-icon">
            <div className="folded-corner">
              {statusMessage && (
                <div
                  className="translation-status"
                  style={{ color: statusMessage.includes("complete") ? "#236738" : "red" }}
                >
                  {statusMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default TranslateDocument;
