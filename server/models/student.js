import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true }, // Example: s1234
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // Added for auth
  grade: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Student", studentSchema);
