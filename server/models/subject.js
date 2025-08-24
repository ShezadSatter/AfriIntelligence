import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // e.g. Mathematics, Economics
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Subject", subjectSchema);
