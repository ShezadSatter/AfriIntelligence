import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { UserContext } from "../../context/userContext";
import axios from "../../axiosConfig";
import styles from  '../styles/form.module.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext)!;

  const [data, setData] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const loginUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await axios.post("/auth/login", data);

      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }

      // 1️⃣ Save user in context
      setUser(response.data.user);

      // 2️⃣ Save JWT to localStorage
      localStorage.setItem("token", response.data.token);

      // 3️⃣ Redirect based on role immediately
      if (response.data.user.role === "teacher") {
        navigate("/teacher-dashboard");
      } else {
        navigate("/selection");
      }
    } catch (err) {
      console.error(err);
      toast.error("Login failed. Please try again.");
    }
  };

  return (
    <div className={styles.loginsection}>

      <div className={styles.logincontainer}>

        <div className={styles.logintitle}>
          <h1>Welcome Back !</h1>
          <h2>Please enter you login details.</h2>
        </div>

        <form className={styles.loginform} onSubmit={loginUser}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={data.email}
            onChange={handleChange}
          />
          <br/>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={data.password}
            onChange={handleChange}
          />
          <button type="submit">Login</button>
        </form>
      </div>

    </div>
  );
};

export default Login;
