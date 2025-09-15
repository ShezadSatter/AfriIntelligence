import React from "react";
import { Link } from "react-router-dom";
import '../styles/navbar.module.css';


const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="logo">Welcome to Afri-Intelligence</div>
      <div>
        <ul className="nav-links">
          <label htmlFor="checkbox_toggle" className="hamburger">
            &#9776;
          </label>
          <div className="menu">
            <li>
              <Link to="/">Home</Link>
            </li>
          </div>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
