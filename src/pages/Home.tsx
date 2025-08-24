import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";
import '../styles/home.module.css';


const Home: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedRole } = useContext(UserContext)!;

  const chooseRole = (role: "teacher" | "student") => {
    setSelectedRole(role);
    navigate("/register"); // or "/login" if login flow
  };

  return (
    <div>
      <h1>Choose Your Role</h1>
      <button onClick={() => chooseRole("teacher")}>Teacher</button>
      <button onClick={() => chooseRole("student")}>Student</button>
    </div>
  );
};

export default Home;
