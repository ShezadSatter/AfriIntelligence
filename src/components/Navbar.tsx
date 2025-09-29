import React from "react";
import { Link } from "react-router-dom";
import '../styles/navbar.module.css';


const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div>
        <ul className="nav-links">
          
          <div className="menu">
            <li>
              <Link to="/selection">Home</Link>
            </li>
          </div>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
