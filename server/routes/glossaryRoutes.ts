import express from "express";
import {services, initDB } from "../db.js";
import Content from "../models/content.js";
import Subject from "../models/subject.js";
import Grade from "../models/grade.js";

const router = express.Router();

// Initialize DB
let dbModels, dbServices;
try {
  const dbInit = await initDB();
  dbModels = dbInit.models;
  dbServices = dbInit.services;
  console.log("✅ Database initialized successfully");
} catch (error) {
  console.error("❌ Database initialization failed:", error);
  process.exit(1);
}

// Helper function to validate allowed characters (basic)
const isValidName = (str: string) => /^[a-zA-Z0-9-_]+$/.test(str);

// ----------------------------
// Get all subjects
// ----------------------------
router.get("/subjects", async (req, res) => {
  try {
    const subjects = await dbServices.getSubjects();
    res.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

// ----------------------------
// Get all grades for a subject
// ----------------------------
router.get("/grades/:subjectSlug", async (req, res) => {
  try {
    const grades = await dbServices.getGrades();
    res.json(grades.map(g => ({ id: g._id, level: g.level, description: g.description })));
  } catch (err) {
    console.error(`💥 Failed to load grades:`, err);
    res.status(500).json({ error: "Failed to load grades" });
  }
});


// ----------------------------
// Get topics for a subject + grade
// ----------------------------
router.get("/topics/:subjectSlug/:gradeLevel", async (req, res) => {
  const { subjectSlug, gradeLevel } = req.params;
  console.log("👉 Looking up:", subjectSlug, gradeLevel);

    try {
    const subject = await Subject.findOne({ slug: subjectSlug });
 console.log("👉 Found subject:", subject);

    if (!subject) return res.status(404).json({ error: "Subject not found" });

    const grade = await Grade.findOne({ level: parseInt(gradeLevel) });
console.log("👉 Found grade:", grade);

    if (!grade) return res.status(404).json({ error: "Grade not found" });

    const topics = await Content.find({ subject: subject._id, grade: grade._id }, "id title")
      .sort({ term: 1 })
      .select("id title")
      .lean();
  console.log("👉 Topics found:", topics.length);
    const topicList = topics.map(t => ({
      id: t.id,
      title: t.title,
      term: t.term,
      category: t.category,
      context: t.context,
      example: t.example,
    }));

    res.json(topicList);
  } catch (err) {
    console.error(`💥 Failed to load topics for ${subjectSlug} grade ${gradeLevel}:`, err);
    res.status(500).json({ error: "Failed to load topics" });
  }
});

// ----------------------------
// Get content for a topic by ID
// ----------------------------
router.get("/terms/:subjectSlug/:gradeLevel/:topicId", async (req, res) => {
  const { subjectSlug, gradeLevel, topicId } = req.params;

  try {
    const subject = await Subject.findOne({ slug: subjectSlug });
    if (!subject) return res.status(404).json({ error: "Subject not found" });

    const grade = await Grade.findOne({ level: parseInt(gradeLevel) });
    if (!grade) return res.status(404).json({ error: "Grade not found" });

    // Use findOne instead of find
    const contents = await Content.find({
      id: topicId,
      subject: subject._id,
      grade: grade._id,
    }).lean();

if (!contents || contents.length === 0) {
  return res.status(404).json({ error: "Topic not found" });
}

const content = contents[0];
    // content.terms is now accessible
    res.json(content.terms || []);

  } catch (err) {
    console.error(`💥 Failed to load content for topic ${topicId}:`, err);
    res.status(500).json({ error: "Failed to load topic content" });
  }
});



// ----------------------------
// Add new content
// ----------------------------
router.post("/content", async (req, res) => {
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
      uploadedBy: req.user?._id, // optional for auth
    });

    await content.populate("subject grade");
    res.status(201).json(content);
  } catch (err: any) {
    console.error("💥 Error creating content:", err);
    if (err.code === 11000) {
      res.status(409).json({ error: "Content with this term already exists for this subject and grade" });
    } else {
      res.status(500).json({ error: "Failed to create content" });
    }
  }
});

export default router;
