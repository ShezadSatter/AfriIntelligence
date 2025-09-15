import React from "react";
import { Link } from "react-router-dom";
import '../styles/navbar.module.css';


const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
          <div className="menu">
            <li>
              <Link to="/">Home</Link>
            </li>
          </div>
    </nav>
  );
};

export default Navbar;
