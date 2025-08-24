import Teacher from "../models/teacher.js";
import Student from "../models/student.js";
import User from "../models/user.js";

import { hashPassword, comparePassword } from "../helpers/auth.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    let userExists;
    if (role === "teacher") {
      userExists = await Teacher.findOne({ email });
    } else {
      userExists = await Student.findOne({ email });
    }

    if (userExists) return res.status(400).json({ error: "Email already in use" });

    const hashedPassword = await hashPassword(password);

    let newUser;
    if (role === "teacher") {
      newUser = await Teacher.create({ name, email, password: hashedPassword, teacherId: `t${Date.now()}` });
    } else {
      newUser = await Student.create({ name, email, password: hashedPassword, studentId: `s${Date.now()}` });
    }

    res.status(201).json({ message: "User registered successfully", user: { name: newUser.name, email: newUser.email, role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) return res.status(400).json({ error: "All fields are required" });

    let user;
    if (role === "teacher") {
      user = await Teacher.findOne({ email });
    } else {
      user = await Student.findOne({ email });
    }

    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });

    // Generate token
    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, { httpOnly: true, sameSite: "none", secure: true });
    res.json({ message: "Login successful", user: { name: user.name, email: user.email, role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    if (decoded.role === "teacher") {
      user = await Teacher.findById(decoded.id);
    } else {
      user = await Student.findById(decoded.id);
    }

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ name: user.name, email: user.email, role: decoded.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
