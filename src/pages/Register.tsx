// src/pages/Register.tsx
import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "../../axiosConfig";
import { UserContext } from "../../context/userContext";
import '../styles/form.module.css';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { selectedRole } = useContext(UserContext)!; // role from Home
  const [data, setData] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const registerUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedRole) {
      toast.error("Please select a role first on the Home page.");
      return;
    }

    const { name, email, password } = data;

    if (!name || !email || !password) {
      toast.error("Please fill all fields.");
      return;
    }

    try {
      const response = await axios.post("/auth/register", {
        name,
        email,
        password,
        role: selectedRole,
      });

      if (response.data.error) {
        toast.error(response.data.error);
      } else {
        toast.success("Registered successfully!");
        setData({ name: "", email: "", password: "" });
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <div className="login-box">
      <div className="child-element left">
        <div className="overlay">
          <h1>Create an<br />Account</h1>
          <br />
          <small>Already have an account?</small>
          <br />
          <small><Link to="/login">Login here</Link></small>
        </div>
      </div>

      <div className="child-element right">
        <form className="inputs" onSubmit={registerUser}>
          <input
            type="text"
            name="name"
            placeholder="Username"
            value={data.name}
            onChange={handleChange}
          />
          <br />
          <input
            type="text"
            name="email"
            placeholder="Email"
            value={data.email}
            onChange={handleChange}
          />
          <br />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={data.password}
            onChange={handleChange}
          />
          <br />
          <div style={{ marginTop: "10px" }}>
            <p>Role: <strong>{selectedRole || "Not selected"}</strong></p>
          </div>
          <br />
          <button type="submit">SignUp</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
