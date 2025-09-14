import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";
import styles from '../styles/home.module.css';


const Home: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedRole } = useContext(UserContext)!;

  const chooseRole = (role: "teacher" | "student") => {
    setSelectedRole(role);
    navigate("/register"); // or "/login" if login flow
  };
  return (
    <div className={styles.home}>
      <img src="C:\Users\ntsan\Documents\GitHub\AfriIntelligence\src\assets\images\logo.jpg" ></img>
      <h1 className={styles.heading}>Welcome to Afri-Intelligence</h1>
      <hr></hr>
      <h2>Your AI powered transaltion assistant for African languages.</h2>
      <h1 className={styles.title}>Choose Your Role</h1>
      <div className={styles.buttons}>
        <button onClick={() => chooseRole("teacher")}>I am a Teacher</button>
        <button onClick={() => chooseRole("student")}>I am a Student</button>
      </div>
    </div>
  );
};

export default Home;
