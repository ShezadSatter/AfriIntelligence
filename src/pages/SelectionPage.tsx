import React from "react";
import { useNavigate } from "react-router-dom";
import "./selectionstyle.css";

const SelectionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="selection-page">
      <section className="title">
        <img src="/assets/images/logo.jpg" alt="logo" />
        <h1>Exam Paper Translation</h1>
        <hr />
      </section>

      <section className="selection">
        <div className="selection-bg">
          <h1>What would you like to do🧑‍🎓</h1>
          <p>Choose the feature you want to use😁</p>

          <button onClick={() => navigate("/tts")}>
            Text-to-Speech
          </button>

          <button onClick={() => navigate("/translate")}>
            Upload Document
          </button>

           <button onClick={() => navigate("/glossary")}>
            Glossary
          </button>

          <button onClick={() => navigate("/past-papers")}>
            Past Papers
          </button>
        </div>
      </section>
    </div>
  );
};

export default SelectionPage;
