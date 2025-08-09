import express from "express";
import fs from "fs";
import path from "path";
import Paper from "../models/Paper.js"; // only if using DB

const router = express.Router();

// Load JSON if not using DB
const papersFile = path.join(process.cwd(), "data", "papers.json");
let papersData = [];
if (fs.existsSync(papersFile)) {
  papersData = JSON.parse(fs.readFileSync(papersFile, "utf8"));
}

// GET /api/papers
router.get("/", async (req, res) => {
  const { subject, grade, year } = req.query;
  const useDatabase = process.env.USE_DB === "true";

  try {
    let results;
    if (useDatabase) {
      // MongoDB query
      const query = {};
      if (subject) query.subject = new RegExp(`^${subject}$`, "i");
      if (grade) query.grade = Number(grade);
      if (year) query.year = Number(year);

      results = await Paper.find(query);
    } else {
      // JSON filter
      results = papersData.filter(paper => {
        return (!subject || paper.subject.toLowerCase() === subject.toLowerCase()) &&
               (!grade || paper.grade === Number(grade)) &&
               (!year || paper.year === Number(year));
      });
    }

    res.json(results);
  } catch (err) {
    console.error("Error fetching papers:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
