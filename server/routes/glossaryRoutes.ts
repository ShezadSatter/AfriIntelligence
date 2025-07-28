import express from "express";
import path from "path";
import { promises as fsPromises } from "fs";

const router = express.Router();

// Helper function to validate allowed characters (basic example)
const isValidName = (str: string) => /^[a-zA-Z0-9-_]+$/.test(str);

router.get("/glossary/:subject/index.json", async (req, res) => {
  const { subject } = req.params;

  if (!isValidName(subject)) {
    return res.status(400).json({ error: "Invalid subject name" });
  }

  const filePath = path.join(__dirname, "..", "glossary", subject, "index.json");

  try {
    await fsPromises.access(filePath);
  } catch {
    return res.status(404).json({ error: "Glossary index not found" });
  }

  try {
    const data = await fsPromises.readFile(filePath, "utf-8");
    res.type("application/json").send(data);
  } catch (error) {
    console.error("Failed to read file:", error);
    res.status(500).json({ error: "Failed to read file" });
  }
});

router.get("/glossary/:subject/:grade/:fileName", async (req, res) => {
  const { subject, grade, fileName } = req.params;

  if (![subject, grade, fileName].every(isValidName)) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const filePath = path.join(__dirname, "..", "glossary", subject, grade, fileName);

  try {
    await fsPromises.access(filePath);
  } catch {
    return res.status(404).json({ error: "Topic file not found" });
  }

  try {
    const data = await fsPromises.readFile(filePath, "utf-8");
    res.type("application/json").send(data);
  } catch (error) {
    console.error("Failed to read topic file:", error);
    res.status(500).json({ error: "Failed to read topic file" });
  }
});

export default router;
