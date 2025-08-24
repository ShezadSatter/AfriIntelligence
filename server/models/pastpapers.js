import mongoose from "mongoose";

const pastPaperSchema = new mongoose.Schema({
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
  year: {
    type: Number,
    required: true,
  },
  paperType: {
    type: String,
    enum: ["p1", "p2"], // Paper 1 or Paper 2
    required: true,
  },
  fileUrl: {
    type: String,
    required: true, // URL to cloud/pdf file
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

export default mongoose.model("PastPaper", pastPaperSchema);
