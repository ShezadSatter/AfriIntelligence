import express from "express";
import path from "path";
import fs from "fs";

const router = express.Router();



// Load glossary index.json
router.get("/glossary/:subject/index.json", (req, res) => {
  const { subject } = req.params;
  const filePath = path.join(__dirname, "..", "glossary", subject, "index.json");

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Glossary index not found" });
  }

  try {
    const data = fs.readFileSync(filePath, "utf-8");
    res.type("application/json").send(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to read file" });
  }
});

// Load a topic file
router.get("/glossary/:subject/:grade/:fileName", (req, res) => {
  const { subject, grade, fileName } = req.params;
  const filePath = path.join(__dirname, "..", "glossary", subject, grade, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Topic file not found" });
  }

  try {
    const data = fs.readFileSync(filePath, "utf-8");
    res.type("application/json").send(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to read topic file" });
  }
});

export default router;
