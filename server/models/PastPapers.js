import mongoose from "mongoose";

const paperSchema = new mongoose.Schema({
  subject: String,
  grade: Number,
  year: Number,
  file: String
});

export default mongoose.model("Paper", paperSchema);
