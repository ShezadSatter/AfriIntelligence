import React from "react";
import { Link } from "react-router-dom";
import '../styles/navbar.module.css';


const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <ul>
        <li><Link to="/">Home 🏡</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
