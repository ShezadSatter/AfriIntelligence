import mongoose from "mongoose";

const termSchema = new mongoose.Schema({
  term: { type: String, required: true },
  definition: { type: String, required: true },
  context: { type: String },
  example: { type: String },
  category: { type: String },
});

const contentSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  grade: { type: mongoose.Schema.Types.ObjectId, ref: "Grade", required: true },
  title: { type: String, required: true },
  id: { type: String, required: true },
  terms: [termSchema],   // <-- make sure this is the subdocument schema
  isActive: { type: Boolean, default: true },
  languageCode: { type: String, default: "en" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Content || mongoose.model("Content", contentSchema);
