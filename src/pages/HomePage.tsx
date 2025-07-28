import React from "react";
import { Link } from "react-router-dom";
import "./styles1.css"; 

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <section className="title">
        <div className="logo">
          <img src="/assets/images/logo.jpg" alt="logo" />
        </div>
        <h1>Afri-Intelligence</h1>
        <hr />
      </section>

      <section className="home-section">
        <div className="home-section-bg">
          <h1>Welcome to Afri-Intelligence</h1>
          <p>Your AI-powered translation assistant for African languages.</p>

          {/* Link instead of anchor */}
          <Link to="/selection">
            <button>Translate</button>
          </Link>

          <div>
            <h1>Key Feature</h1>
            <hr />
            <ul>
              <li>Language Selection</li>
              <li>Dynamic Translation</li>
              <li>Text-to-Speech</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
