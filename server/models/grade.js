import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema({
  level: { type: Number, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ Fix OverwriteModelError:
const Grade = mongoose.models.Grade || mongoose.model("Grade", gradeSchema);
export default Grade;
