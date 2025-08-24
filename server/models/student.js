import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true, // Example: st1234
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
  },
  grade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Grade",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Student", studentSchema);
