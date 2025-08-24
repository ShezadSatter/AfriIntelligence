import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  teacherId: { type: String, required: true, unique: true }, // Example: t1234
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // Added for auth
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Teacher", teacherSchema);
