import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";
import '../styles/dashboard.module.css';

const Dashboard: React.FC = () => {
  const { user } = useContext(UserContext)!;
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Redirect students to selection immediately
    if (user.role === "student") {
      navigate("/selection");
    }
  }, [user, navigate]); // ← reacts immediately when `user` changes

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <h1>Dashboard</h1>
      {user.role === "teacher" && <h2>Welcome Educator {user.name}!</h2>}
    </div>
  );
};

export default Dashboard;
