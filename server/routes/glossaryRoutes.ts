import express from "express";
import path from "path";
import { promises as fsPromises } from "fs";
import { fileURLToPath } from 'url';


const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

router.post("/upload", async (req, res) => {
  try {
    const { subjectId, gradeId, term, definition, example, context, category } = req.body;
    
    if (!subjectId || !gradeId || !term || !definition) {
      return res.status(400).json({ error: "Missing required fields: subjectId, gradeId, term, definition" });
    }
    
    const content = await dbServices.createContent({
      subjectId,
      gradeId,
      term,
      definition,
      example,
      context,
      category,
      uploadedBy: req.user?._id // Add user auth later
    });
    
    await content.populate('subject grade');
    res.status(201).json(content);
  } catch (error) {
    console.error("Error creating content:", error);
    if (error.code === 11000) {
      res.status(409).json({ error: "Content with this term already exists for this subject and grade" });
    } else {
      res.status(500).json({ error: "Failed to create content" });
    }
  }

    // Read existing file or create default structure
    let existingData: any = {
      subject,
      grade,
      title,
      id,
      terms: []
    };

    if (await fsPromises.access(filePath).then(() => true).catch(() => false)) {
      const content = await fsPromises.readFile(filePath, "utf-8");
      existingData = JSON.parse(content);
    }

    // Append new terms
    if (!Array.isArray(existingData.terms)) {
      existingData.terms = [];
    }
    existingData.terms.push(...terms); // append new terms array

    await fsPromises.writeFile(filePath, JSON.stringify(existingData, null, 2));

    res.json({ message: "Glossary terms appended", filePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save glossary item" });
  }
});




export default router;
