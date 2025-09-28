// server/routes/glossaryRoutes.js

import express from "express"; // reupload
import Content from "../models/content.js";
import Subject from "../models/subject.js";
import Grade from "../models/grade.js";

const router = express.Router();

// Don't initialize DB here - use the models directly since DB is initialized in index.js

// Helper function to validate allowed characters (basic)
const isValidName = (str) => /^[a-zA-Z0-9-_]+$/.test(str);

// ----------------------------
// Get all subjects
// ----------------------------
router.get("/subjects", async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true }).select("name slug").lean();
    res.json(subjects);
  } catch (err) {
    console.error("Error fetching subjects:", err);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

// ----------------------------
// Get grades for a specific subject - MISSING ROUTE ADDED
// ----------------------------
router.get("/grades/:subject", async (req, res) => {
  try {
    const { subject } = req.params;

    // Optional: check if subject exists
    const subj = await Subject.findOne({ slug: subject.toLowerCase() });
    if (!subj) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // Return all active grades (same as your index.js implementation)
    const grades = await Grade.find({ isActive: true })
      .sort({ level: 1 })
      .lean();

    res.json(grades); // <-- this returns an array for frontend .map()
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
});

// ----------------------------
// Get all grades for a subject (alternative route - keeping for compatibility)
// ----------------------------
router.get("/grades/:subjectSlug", async (req, res) => {
  try {
    const { subjectSlug } = req.params;
    const subject = await Subject.findOne({ slug: subjectSlug });

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const grades = await Grade.find({ isActive: true })
      .select("_id level description")
      .sort({ level: 1 });

    res.json(grades);
  } catch (err) {
    console.error("Failed to load grades:", err);
    res.status(500).json({ error: "Failed to load grades" });
  }
});

// ----------------------------
// Get topics for a subject + grade
// ----------------------------
router.get("/topics/:subjectSlug/:gradeLevel", async (req, res) => {
  const { subjectSlug, gradeLevel } = req.params;
  console.log("Looking up:", subjectSlug, gradeLevel);

  try {
    const subject = await Subject.findOne({ slug: subjectSlug });
    console.log("Found subject:", subject);

    if (!subject) return res.status(404).json({ error: "Subject not found" });

    const grade = await Grade.findOne({ level: parseInt(gradeLevel) });
    console.log("Found grade:", grade);

    if (!grade) return res.status(404).json({ error: "Grade not found" });

    const topics = await Content.find({ subject: subject._id, grade: grade._id })
      .sort({ title: 1 })
      .select("id title term category context example")
      .lean();
    
    console.log("Topics found:", topics.length);
    
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
    console.error(`Failed to load topics for ${subjectSlug} grade ${gradeLevel}:`, err);
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

    // Find the specific content by topicId
    const contents = await Content.find({
      id: topicId,
      subject: subject._id,
      grade: grade._id,
    }).lean();

    if (!contents || contents.length === 0) {
      return res.status(404).json({ error: "Topic not found" });
    }

    const content = contents[0];
    // Return the terms array from the content
    res.json(content.terms || []);

  } catch (err) {
    console.error(`Failed to load content for topic ${topicId}:`, err);
    res.status(500).json({ error: "Failed to load topic content" });
  }
});

// ----------------------------
// Upload glossary content (FIXED VERSION)
// ----------------------------
router.post("/glossary/upload", async (req, res) => {
  try {
    console.log("📝 Received upload request body:", req.body);
    console.log("📝 Request headers:", req.headers);
    
    // Add more defensive checks for req.body
    if (!req.body) {
      console.log("❌ No request body received");
      return res.status(400).json({ error: "No request body received" });
    }
    
    // Safe destructuring with default empty object
    const requestBody = req.body || {};
    const { subject, grade, title, id, terms } = requestBody;
    
    console.log("📝 Extracted fields:", { subject, grade, title, id, termsType: typeof terms });
    
    if (!subject || !grade || !title || !id || !terms) {
      console.log("❌ Missing required fields:", {
        subject: !!subject,
        grade: !!grade, 
        title: !!title,
        id: !!id,
        terms: !!terms
      });
      return res.status(400).json({ error: "Missing required fields: subject, grade, title, id, terms" });
    }
    
    // Find subject and grade from database
    console.log("🔍 Looking for subject with ID:", subject);
    const subjectDoc = await Subject.findById(subject);
    console.log("📚 Found subject:", subjectDoc);
    
    console.log("🔍 Looking for grade with ID:", grade);
    const gradeDoc = await Grade.findById(grade);
    console.log("📊 Found grade:", gradeDoc);
    
    if (!subjectDoc || !gradeDoc) {
      console.log("❌ Subject or grade not found in database");
      return res.status(404).json({ error: "Subject or grade not found" });
    }
    
    // Validate and parse terms
    let parsedTerms;
    try {
      if (typeof terms === 'string') {
        parsedTerms = JSON.parse(terms);
      } else if (Array.isArray(terms)) {
        parsedTerms = terms;
      } else {
        throw new Error("Terms must be a string (JSON) or array");
      }
      
      if (!Array.isArray(parsedTerms)) {
        throw new Error("Terms must be an array");
      }
      
      // Validate each term has required fields
      for (let i = 0; i < parsedTerms.length; i++) {
        const term = parsedTerms[i];
        if (!term.term || !term.definition) {
          throw new Error(`Term at index ${i} missing required 'term' or 'definition' field`);
        }
      }
      
      console.log("✅ Parsed terms successfully:", parsedTerms.length, "terms");
    } catch (err) {
      console.log("❌ Terms parsing error:", err.message);
      return res.status(400).json({ 
        error: "Invalid terms format", 
        details: err.message,
        expected: "Array of objects with 'term' and 'definition' fields"
      });
    }
    
    // Check for existing content with same ID
    const existingContent = await Content.findOne({
      id: id,
      subject: subjectDoc._id,
      grade: gradeDoc._id
    });
    
    if (existingContent) {
      console.log("❌ Content with this ID already exists");
      return res.status(409).json({ error: "Content with this ID already exists for this subject and grade" });
    }
    
    // Create content with the provided terms
    console.log("💾 Creating content...");
    const contentData = {
      subject: subjectDoc._id,
      grade: gradeDoc._id,
      title: title,
      id: id,
      terms: parsedTerms,
      uploadedBy: req.user?._id || null
    };
    console.log("📋 Content data:", contentData);
    
    const content = await Content.create(contentData);
    console.log("✅ Content created successfully with _id:", content._id);
    
    res.status(201).json({ 
      message: "Glossary uploaded successfully", 
      content: {
        _id: content._id,
        subject: subjectDoc.name,
        grade: gradeDoc.level,
        title: content.title,
        id: content.id,
        termsCount: parsedTerms.length
      }
    });
  } catch (error) {
    console.error("💥 Error uploading glossary:", error);
    console.error("💥 Error stack:", error.stack);
    
    if (error.code === 11000) {
      res.status(409).json({ error: "Content with this ID already exists for this subject and grade" });
    } else if (error.name === 'ValidationError') {
      res.status(400).json({ error: "Validation failed", details: error.message });
    } else if (error.name === 'CastError') {
      res.status(400).json({ error: "Invalid ID format", details: error.message });
    } else {
      res.status(500).json({ 
        error: "Failed to upload glossary", 
        details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
      });
    }
  }
});

// ----------------------------
// Add new content (alternative route)
// ----------------------------
router.post("/content", async (req, res) => {
  try {
    const { subjectId, gradeId, term, definition, example, context, category } = req.body;

    if (!subjectId || !gradeId || !term || !definition) {
      return res.status(400).json({ error: "Missing required fields: subjectId, gradeId, term, definition" });
    }

    const content = await Content.create({
      subject: subjectId,
      grade: gradeId,
      term,
      definition,
      example,
      context,
      category,
      uploadedBy: req.user?._id,
    });

    await content.populate("subject grade");
    res.status(201).json(content);
  } catch (err) {
    console.error("Error creating content:", err);
    if (err.code === 11000) {
      res.status(409).json({ error: "Content with this term already exists for this subject and grade" });
    } else {
      res.status(500).json({ error: "Failed to create content" });
    }
  }
});

export default router;