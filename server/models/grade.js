import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true, // e.g. 10, 11, 12
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Grade", gradeSchema);
