import express from "express";
import path from "path";
import fs from "fs/promises";
import multer from "multer";
import { fileURLToPath } from "url";

const router = express.Router();

// For __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to validate query params
function isValidParam(param) {
  return typeof param === "string" && param.trim() !== "";
}

// ----------------------------
// GET /api/past-papers
// ----------------------------
router.get("/", async (req, res) => {
  const { grade, subject, year, paper } = req.query;

  if (!isValidParam(grade) || !isValidParam(subject) || !isValidParam(year)) {
    return res
      .status(400)
      .json({ error: "Missing or invalid query parameters: grade, subject, year are required" });
  }

  try {
    const filePath = path.join(__dirname, "..", "data", "pastPapers.json");
    const dataRaw = await fs.readFile(filePath, "utf8");
    const pastPapers = JSON.parse(dataRaw);

    let filtered = pastPapers.filter(
      (p) =>
        p.grade === grade &&
        p.subject.toLowerCase() === subject.toLowerCase() &&
        p.year === year
    );

    if (paper === "P1" || paper === "P2") {
      filtered = filtered.filter((p) =>
        p.fileUrl.toUpperCase().includes(paper.toUpperCase())
      );
    }

    if (filtered.length === 0) {
      return res
        .status(404)
        .json({ error: "Past paper not found for the specified criteria" });
    }

    res.json(filtered[0]);
  } catch (error) {
    console.error("Error reading past papers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------------------
// GET /api/past-papers/file
// ----------------------------
router.get("/file", async (req, res) => {
  const { filePath: fileQuery, preview } = req.query;
  if (!fileQuery) {
    return res.status(400).json({ error: "Missing filePath query parameter" });
  }
  const absPath = path.join(__dirname, "..", "data", "pdfs", fileQuery);
  try {
    res.setHeader("Content-Type", "application/pdf");
    if (preview === "true") {
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${path.basename(fileQuery)}"`
      );
    } else {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.basename(fileQuery)}"`
      );
    }
    res.sendFile(absPath);
  } catch (err) {
    res.status(404).json({ error: "File not found" });
  }
});

// ----------------------------
// GET /api/past-papers/filters
// ----------------------------
router.get("/filters", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "..", "data", "pastPapers.json");
    const dataRaw = await fs.readFile(filePath, "utf8");
    const pastPapers = JSON.parse(dataRaw);

    const grades = [...new Set(pastPapers.map((p) => p.grade))].sort();
    const subjects = [...new Set(pastPapers.map((p) => p.subject))].sort();
    const years = [...new Set(pastPapers.map((p) => p.year))].sort();

    res.json({ grades, subjects, years });
  } catch (error) {
    res.status(500).json({ error: "Failed to load filters" });
  }
});

// ----------------------------
// POST /api/past-papers/upload
// ----------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "data", "pdfs", "DBE Past Papers"));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

router.post("/upload", upload.single("file"), async (req, res) => {
  const { grade, subject, year, paper, language } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const filePath = path.join(__dirname, "..", "data", "pastPapers.json");
    const dataRaw = await fs.readFile(filePath, "utf8");
    const pastPapers = JSON.parse(dataRaw);

    const newPaper = {
      id: Date.now().toString(),
      grade,
      subject,
      year,
      paper,
      language,
      fileUrl: req.file.filename,
    };

    pastPapers.push(newPaper);
    await fs.writeFile(filePath, JSON.stringify(pastPapers, null, 2));

    res.json({ message: "Upload successful", paper: newPaper });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to save past paper" });
  }
});

export default router;
