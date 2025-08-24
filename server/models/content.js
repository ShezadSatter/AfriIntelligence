import mongoose from "mongoose";

const contentSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  grade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Grade",
    required: true,
  },
  term: {
    type: String,
    required: true,
  },
  definition: {
    type: String,
    required: true,
  },
  example: {
    type: String,
  },
  context: {
    type: String,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Content", contentSchema);
