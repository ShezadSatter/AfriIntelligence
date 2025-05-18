import React from "react";
import { Link } from "react-router-dom";
import "./selectionstyle.css";

const SelectionPage: React.FC = () => {
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

          <Link to="/tts">
            <button>Text-to-Speech</button>
          </Link>

          <Link to="/translate-document">
            <button>Upload Document</button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default SelectionPage;
