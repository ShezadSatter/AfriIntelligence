// src/components/SelectionPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../pages/selectionstyle.css";

const SelectionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="body">
      <section className="title">
        <img src="/assets/images/logo.jpg" alt="logo" />
        <h1>Exam Paper Translation</h1>
        <hr />
      </section>

      <section className="selection">
        <div className="selection-bg">
          <h1>Select Source Language</h1>
          <p>Choose the language of the text you want to translate.</p>

          <div className="options">
            <div className="language-selector" id="dropdown">
              <label htmlFor="language">Select Target Language:</label>
              <select id="language" className="button">
                <option value="zu">Zulu</option>
                <option value="xh">Xhosa</option>
                <option value="st">Sesotho</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <button onClick={() => navigate("/tts")}>Text-to-Speech</button>
          <button onClick={() => navigate("/translate")}>Upload Document</button>
        </div>
      </section>
    </div>
  );
};

export default SelectionPage;
