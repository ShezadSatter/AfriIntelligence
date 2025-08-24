import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
import fs from "fs-extra";     
import { Document, Packer, Paragraph } from "docx";
import path from "path";
import { fileURLToPath } from 'url';
import translate from "@iamtraction/google-translate";
import authRoutes from './routes/authRoutes.js';
import cookieParser from 'cookie-parser';
import glossaryRoutes from "./routes/glossaryRoutes.ts";



// Import our database
import { initDB, models, services } from "./db.js";

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
let dbModels, dbServices;
try {
  const dbInit = await initDB();
  dbModels = dbInit.models;
//  dbServices = dbInit.services;
  console.log("✅ Database initialized successfully");
} catch (error) {
  console.error("❌ Database initialization failed:", error);
  process.exit(1);
}




// ----------------------------
// Middleware Setup
// ----------------------------

// Body parser
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",                  // Dev backend
  "http://localhost:5173",                  // Dev frontend (Vite)
  "http://localhost:3001",                  // Alt dev frontend
  "https://afri-intelligence.vercel.app",   // Prod frontend
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Multer setup for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDFs and Word docs
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
});





// Simple validation helpers
const isValidName = (name) => /^[a-zA-Z0-9-_\.]+$/.test(name);
const isValidSlug = (slug) => /^[a-z0-9-]+$/.test(slug);

// ----------------------------
// Health Check Routes
// ----------------------------

app.get("/", (req, res) => {
  res.json({ 
    message: "AfriIntelligence API is running 🚀",
    timestamp: new Date().toISOString(),
    version: "2.0.0"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    const subjects = await dbModels.Subject.countDocuments();
    res.json({ 
      status: "healthy",
      database: "connected",
      subjects: subjects,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: "unhealthy",
      database: "disconnected",
      error: error.message
    });
  }
});

// ----------------------------
// API Routes - Subjects & Grades
// ----------------------------

// Get all subjects
app.get("/api/subjects", async (req, res) => {
  try {
    const subjects = await dbServices.getSubjects();
    res.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

// Get all grades
app.get("/api/grades", async (req, res) => {
  try {
    const grades = await dbServices.getGrades();
    res.json(grades);
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
});

// ----------------------------
// API Routes - Content (Glossary)
// ----------------------------

// Get content/glossary
app.get("/api/content", async (req, res) => {
  try {
    const { subject, grade, search, page, limit } = req.query;
    
    const result = await dbServices.getContent({
      subjectSlug: subject,
      gradeLevel: grade ? parseInt(grade) : null,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50
    });
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

// Create new content (for teachers)
app.post("/api/content", async (req, res) => {
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
});

// ----------------------------
// API Routes - Past Papers
// ----------------------------
import pastPaperRoutes from './routes/pastPapers.js';
app.use('/api/past-papers', pastPaperRoutes);

// Get past papers
app.get("/api/past-papers", async (req, res) => {
  try {
    const { subject, grade, year, paperType, page, limit } = req.query;
    
    const result = await dbServices.getPastPapers({
      subjectSlug: subject,
      gradeLevel: grade ? parseInt(grade) : null,
      year: year ? parseInt(year) : null,
      paperType,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50
    });
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching past papers:", error);
    res.status(500).json({ error: "Failed to fetch past papers" });
  }
});

// Upload new past paper (for teachers)
app.post("/api/past-papers", upload.single('file'), async (req, res) => {
  try {
    const { subjectId, gradeId, year, paperType } = req.body;
    const file = req.file;
    
    if (!subjectId || !gradeId || !year || !paperType || !file) {
      return res.status(400).json({ 
        error: "Missing required fields: subjectId, gradeId, year, paperType, and file" 
      });
    }
    
    // Validate paper type
    if (!['p1', 'p2', 'p3'].includes(paperType)) {
      return res.status(400).json({ error: "Invalid paperType. Must be p1, p2, or p3" });
    }
    
    // Create document file record
    const documentFile = await dbServices.createDocumentFile({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      strategy: 'local',
      filePath: file.path,
      uploadedBy: req.user?._id
    });
    
    // Create past paper record
    const pastPaper = await dbServices.createPastPaper({
      subjectId,
      gradeId,
      year: parseInt(year),
      paperType,
      fileId: documentFile._id,
      uploadedBy: req.user?._id
    });
    
    res.status(201).json(pastPaper);
  } catch (error) {
    console.error("Error uploading past paper:", error);
    // Clean up uploaded file if error occurs
    if (req.file?.path) {
      await fs.remove(req.file.path).catch(console.error);
    }
    res.status(500).json({ error: "Failed to upload past paper" });
  }
});

// Download past paper (with tracking)
app.get("/api/past-papers/:id/download", async (req, res) => {
  try {
    const paper = await dbModels.PastPaper.findById(req.params.id)
      .populate('file subject');
    
    if (!paper) {
      return res.status(404).json({ error: "Past paper not found" });
    }
    
    // Record download
    await dbServices.recordDownload(paper._id);
    
    // Handle different file storage strategies
    if (paper.file) {
      if (paper.file.strategy === 'local' && paper.file.filePath) {
        const fullPath = path.resolve(paper.file.filePath);
        if (await fs.pathExists(fullPath)) {
          return res.download(fullPath, paper.file.originalName || paper.file.filename);
        }
      } else if (paper.file.cloudUrl) {
        return res.redirect(paper.file.cloudUrl);
      }
    } else if (paper.fileUrl) {
      // Legacy support - direct file URL
      const filePath = path.join(__dirname, 'data', 'pdfs', paper.fileUrl);
      if (await fs.pathExists(filePath)) {
        return res.download(filePath);
      }
    }
    
    res.status(404).json({ error: "File not found or no longer available" });
  } catch (error) {
    console.error("Error downloading past paper:", error);
    res.status(500).json({ error: "Failed to download past paper" });
  }
});

// ----------------------------
// Legacy API Routes (for backward compatibility)
// ----------------------------
app.use("/api/glossary", glossaryRoutes);




// Master glossary index (returns subjects list)
app.get("/api/glossary/index.json", async (req, res) => {
  try {
    const subjects = await dbServices.getSubjects();
    const subjectSlugs = subjects.map(s => s.slug);
    res.json({ subjects: subjectSlugs });
  } catch (error) {
    console.error("Error fetching glossary index:", error);
    res.status(500).json({ error: "Failed to fetch glossary index" });
  }
});

// Subject-specific glossary index
app.get("/api/glossary/:subject/index.json", async (req, res) => {
  try {
    const { subject } = req.params;
    if (!isValidSlug(subject)) {
      return res.status(400).json({ error: "Invalid subject parameter" });
    }
    
    const grades = await dbServices.getGrades();
    const gradeData = {};
    
    for (const grade of grades) {
      const result = await dbServices.getContent({
        subjectSlug: subject,
        gradeLevel: grade.level,
        limit: 1000 // Get all for index
      });
      
      if (result.content.length > 0) {
        gradeData[grade.level] = result.content.map(c => ({
          term: c.term,
          definition: c.definition,
          example: c.example,
          context: c.context
        }));
      }
    }
    
    res.json(gradeData);
  } catch (error) {
    console.error("Error fetching subject glossary:", error);
    res.status(500).json({ error: "Failed to fetch subject glossary" });
  }
});

// ----------------------------
// Translation Routes
// ----------------------------

// Get available languages
app.get("/api/languages", async (req, res) => {
  try {
    const languages = await dbServices.getLanguages();
    res.json(languages);
  } catch (error) {
    console.error("Error fetching languages:", error);
    res.status(500).json({ error: "Failed to fetch languages" });
  }
});

// Translate plain text
app.post('/api/translate', async (req, res) => {
  const { q, target } = req.body;

  if (!q || !target) {
    return res.status(400).json({ error: 'Missing required parameters: q (text) and target (language code)' });
  }

  try {
    const result = await translate(q, { to: target });
    res.json({
      data: {
        translations: [
          { translatedText: result.text }
        ]
      }
    });
  } catch (err) {
    console.error('Translation error:', err);
    res.status(500).json({ error: 'Translation failed', message: err.message });
  }
});


app.post("/api/translate-file", upload.single("file"), async (req, res) => {
   const pdfParse = (await import("pdf-parse")).default; 
  const file = req.file;
  const targetLang = req.body.target;

  if (!file) return res.status(400).json({ error: "No file uploaded" });
  if (!targetLang) return res.status(400).json({ error: "No target language specified" });

  try {
    let text = "";

    // PDF
    if (file.mimetype === "application/pdf") {
      try {
        const dataBuffer = await fs.readFile(file.path);
        const pdfData = await pdfParse(dataBuffer);
        text = pdfData.text;
      } catch (err) {
        throw new Error("Failed to read PDF file. Is it valid?");
      }
      console.log(pdfData.text);
    }
    // DOCX
    else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ path: file.path });
      text = result.value;
    }

    if (!text.trim()) {
      throw new Error("No text found in the uploaded file");
    }

    // Translate
    const { text: translatedText } = await translate(text, { to: targetLang });

    // Create DOCX
    const doc = new Document({
      sections: [
        {
          children: translatedText
            .split("\n")
            .filter(line => line.trim() !== "")
            .map(line => new Paragraph(line.trim())),
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.join("uploads", `translated_${Date.now()}.docx`);
    await fs.writeFile(outputPath, buffer);

    // Send the file
    res.download(outputPath, `translated_${file.originalname.replace(/\.[^/.]+$/, "")}.docx`, async (err) => {
      // Clean up
      await fs.remove(file.path).catch(console.error);
      await fs.remove(outputPath).catch(console.error);
      if (err) console.error("Download error:", err);
    });

  } catch (err) {
    // Cleanup uploaded file on error
    if (file?.path) await fs.remove(file.path).catch(console.error);
    console.error("Translation error:", err);
    res.status(500).json({ error: "Translation failed", message: err.message });
  }
});

// ----------------------------
// Data Migration Routes
// ----------------------------

// Check migration status
app.get("/api/migrate/status", async (req, res) => {
  try {
    const stats = {
      subjects: await dbModels.Subject.countDocuments(),
      grades: await dbModels.Grade.countDocuments(),
      content: await dbModels.Content.countDocuments(),
      pastPapers: await dbModels.PastPaper.countDocuments(),
      documentFiles: await dbModels.DocumentFile.countDocuments(),
    };
    
    // Check if JSON files exist
    const jsonFiles = {
      pastPapersJson: await fs.pathExists(path.join(__dirname, 'pastPapers.json')),
      indexJson: await fs.pathExists(path.join(__dirname, 'index.json')),
      glossaryDir: await fs.pathExists(path.join(__dirname, 'data/glossary')),
      pdfsDir: await fs.pathExists(path.join(__dirname, 'data/pdfs')),
    };
    
    res.json({
      databaseStats: stats,
      jsonFilesStatus: jsonFiles,
      migrationNeeded: {
        pastPapers: stats.pastPapers === 0 && jsonFiles.pastPapersJson,
        content: stats.content === 0 && jsonFiles.glossaryDir
      },
      recommendation: stats.pastPapers === 0 && jsonFiles.pastPapersJson 
        ? "Run POST /api/migrate/past-papers to migrate your data"
        : "Database appears to be populated"
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ error: "Failed to check migration status" });
  }
});

// Migrate past papers from JSON to database
app.post("/api/migrate/past-papers", async (req, res) => {
  try {
    const pastPapersPath = path.join(__dirname, 'pastPapers.json');
    
    if (!await fs.pathExists(pastPapersPath)) {
      return res.status(404).json({ 
        error: "pastPapers.json not found",
        path: pastPapersPath
      });
    }
    
    const pastPapersData = await fs.readJson(pastPapersPath);
    
    let migrated = 0;
    let skipped = 0;
    let errors = [];
    
    console.log(`Starting migration of ${pastPapersData.length} past papers...`);
    
    for (const paperData of pastPapersData) {
      try {
        // Find subject by name (case insensitive)
        const subject = await dbModels.Subject.findOne({ 
          name: { $regex: new RegExp(`^${paperData.subject}$`, 'i') } 
        });
        
        // Find grade by level
        const grade = await dbModels.Grade.findOne({ 
          level: parseInt(paperData.grade) 
        });
        
        if (!subject || !grade) {
          errors.push(`Subject "${paperData.subject}" or Grade "${paperData.grade}" not found`);
          continue;
        }
        
        // Determine paper type from fileUrl
        let paperType = 'p1';
        const fileUrl = paperData.fileUrl.toLowerCase();
        if (fileUrl.includes('p2')) {
          paperType = 'p2';
        } else if (fileUrl.includes('p3')) {
          paperType = 'p3';
        }
        
        // Check if this paper already exists
        const existingPaper = await dbModels.PastPaper.findOne({
          subject: subject._id,
          grade: grade._id,
          year: parseInt(paperData.year),
          paperType
        });
        
        if (existingPaper) {
          skipped++;
          continue;
        }
        
        // Check if PDF file exists
        const pdfPath = path.join(__dirname, 'data/pdfs', paperData.fileUrl);
        const fileExists = await fs.pathExists(pdfPath);
        
        if (!fileExists) {
          // Still create the record but note file is missing
          await dbServices.createPastPaper({
            subjectId: subject._id,
            gradeId: grade._id,
            year: parseInt(paperData.year),
            paperType,
            fileUrl: paperData.fileUrl
          });
          
          errors.push(`PDF file not found but record created: ${paperData.fileUrl}`);
          migrated++;
          continue;
        }
        
        // Get file stats
        const stats = await fs.stat(pdfPath);
        
        // Create DocumentFile record
        const documentFile = await dbServices.createDocumentFile({
          filename: path.basename(paperData.fileUrl),
          originalName: path.basename(paperData.fileUrl),
          mimeType: 'application/pdf',
          size: stats.size,
          strategy: 'local',
          filePath: pdfPath,
          uploadedBy: null
        });
        
        // Create past paper record
        await dbServices.createPastPaper({
          subjectId: subject._id,
          gradeId: grade._id,
          year: parseInt(paperData.year),
          paperType,
          fileId: documentFile._id,
          fileUrl: paperData.fileUrl // Keep for backward compatibility
        });
        
        migrated++;
      } catch (error) {
        errors.push(`Error migrating paper ${paperData.fileUrl}: ${error.message}`);
      }
    }
    
    console.log(`Migration completed: ${migrated} migrated, ${skipped} skipped`);
    
    res.json({
      success: true,
      migrated,
      skipped,
      total: pastPapersData.length,
      errors: errors.length > 0 ? errors : null,
      message: `Successfully migrated ${migrated} past papers${skipped > 0 ? `, skipped ${skipped} existing records` : ''}`
    });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ 
      error: "Migration failed", 
      message: error.message 
    });
  }
});

// Migrate content/glossary from JSON files
app.post("/api/migrate/content", async (req, res) => {
  try {
    const glossaryPath = path.join(__dirname, 'data/glossary');
    
    if (!await fs.pathExists(glossaryPath)) {
      return res.status(404).json({ 
        error: "Glossary directory not found",
        path: glossaryPath
      });
    }
    
    let migrated = 0;
    let skipped = 0;
    let errors = [];
    
    // Read index.json to get subjects
    const indexPath = path.join(__dirname, 'index.json');
    if (!await fs.pathExists(indexPath)) {
      return res.status(404).json({ 
        error: "index.json not found",
        path: indexPath
      });
    }
    
    const indexData = await fs.readJson(indexPath);
    console.log(`Starting content migration for subjects: ${indexData.subjects.join(', ')}`);
    
    for (const subjectSlug of indexData.subjects) {
      try {
        // Find subject by slug
        const subject = await dbModels.Subject.findOne({ slug: subjectSlug });
        if (!subject) {
          errors.push(`Subject not found for slug: ${subjectSlug}`);
          continue;
        }
        
        // Read subject's glossary file
        const subjectGlossaryPath = path.join(glossaryPath, `${subjectSlug}.json`);
        if (!await fs.pathExists(subjectGlossaryPath)) {
          errors.push(`Glossary file not found: ${subjectSlug}.json`);
          continue;
        }
        
        const glossaryData = await fs.readJson(subjectGlossaryPath);
        
        // Process each grade's content
        for (const [gradeLevel, terms] of Object.entries(glossaryData)) {
          const grade = await dbModels.Grade.findOne({ level: parseInt(gradeLevel) });
          if (!grade) {
            errors.push(`Grade ${gradeLevel} not found`);
            continue;
          }
          
          // Process each term
          if (Array.isArray(terms)) {
            for (const termData of terms) {
              try {
                // Check if term already exists
                const existing = await dbModels.Content.findOne({
                  subject: subject._id,
                  grade: grade._id,
                  term: termData.term
                });
                
                if (existing) {
                  skipped++;
                  continue;
                }
                
                await dbServices.createContent({
                  subjectId: subject._id,
                  gradeId: grade._id,
                  term: termData.term,
                  definition: termData.definition,
                  example: termData.example || null,
                  context: termData.context || null,
                  category: termData.category || null,
                  languageCode: 'en',
                  uploadedBy: null
                });
                migrated++;
              } catch (error) {
                errors.push(`Error migrating term "${termData.term}": ${error.message}`);
              }
            }
          }
        }
      } catch (error) {
        errors.push(`Error processing subject ${subjectSlug}: ${error.message}`);
      }
    }
    
    console.log(`Content migration completed: ${migrated} migrated, ${skipped} skipped`);
    
    res.json({
      success: true,
      migrated,
      skipped,
      errors: errors.length > 0 ? errors : null,
      message: `Successfully migrated ${migrated} content items${skipped > 0 ? `, skipped ${skipped} existing records` : ''}`
    });
  } catch (error) {
    console.error("Content migration error:", error);
    res.status(500).json({ 
      error: "Content migration failed", 
      message: error.message 
    });
  }
});

// Clean up orphaned files
app.post("/api/migrate/cleanup", async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: "Cleanup not allowed in production" });
  }
  
  try {
    // Find DocumentFiles that don't have corresponding PastPapers
    const orphanedFiles = await dbModels.DocumentFile.find({
      _id: { 
        $nin: await dbModels.PastPaper.distinct('file').filter(Boolean)
      }
    });
    
    let cleaned = 0;
    for (const file of orphanedFiles) {
      try {
        // Remove physical file if it exists
        if (file.filePath && await fs.pathExists(file.filePath)) {
          await fs.remove(file.filePath);
        }
        // Remove database record
        await file.deleteOne();
        cleaned++;
      } catch (error) {
        console.error(`Error cleaning up file ${file.filename}:`, error);
      }
    }
    
    res.json({
      success: true,
      cleaned,
      message: `Cleaned up ${cleaned} orphaned files`
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    res.status(500).json({ error: "Cleanup failed" });
  }
});

// ----------------------------
// Static File Serving
// ----------------------------

// Serve PDF files
app.use('/pdfs', express.static(path.join(__dirname, 'data', 'pdfs')));

// Test file access route
app.get('/test-file-access', async (req, res) => {
  const testFiles = [
    'data/pdfs/DBE Past Papers/Mathematical Literacy P2 Nov 2014 Eng.pdf',
    'pastPapers.json',
    'index.json'
  ];
  
  const results = {};
  
  for (const testFile of testFiles) {
    const filePath = path.join(__dirname, testFile);
    try {
      await fs.access(filePath);
      const stats = await fs.stat(filePath);
      results[testFile] = { 
        exists: true, 
        size: stats.size,
        path: filePath
      };
    } catch (err) {
      results[testFile] = { 
        exists: false, 
        error: err.message,
        path: filePath
      };
    }
  }
  
  res.json(results);
});


app.use(cookieParser());






// routes
app.use('/auth', authRoutes);




// ----------------------------
// Development/Debug Routes
// ----------------------------

// Get database stats
app.get("/api/debug/stats", async (req, res) => {
  try {
    const stats = {
      subjects: await dbModels.Subject.countDocuments(),
      grades: await dbModels.Grade.countDocuments(),
      content: await dbModels.Content.countDocuments(),
      pastPapers: await dbModels.PastPaper.countDocuments(),
      users: await dbModels.User.countDocuments(),
      languages: await dbModels.Language.countDocuments(),
      files: await dbModels.DocumentFile.countDocuments(),
      translations: await dbModels.Translation.countDocuments(),
    };
    
    // Get sample data
    const samples = {
      latestPapers: await dbModels.PastPaper.find()
        .populate('subject grade')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title subject grade year paperType'),
      subjects: await dbModels.Subject.find().select('name slug'),
      grades: await dbModels.Grade.find().select('level')
    };
    
    res.json({ stats, samples });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Reset/reseed database (development only)
app.post("/api/debug/reseed", async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: "Not allowed in production" });
  }
  
  try {
    // Clear existing data
    await Promise.all([
      dbModels.Subject.deleteMany({}),
      dbModels.Grade.deleteMany({}),
      dbModels.Language.deleteMany({})
    ]);
    
    // Re-initialize database (calls seedBasics internally)
    await initDB();
    
    res.json({ success: true, message: "Database reseeded successfully" });
  } catch (error) {
    console.error("Error reseeding database:", error);
    res.status(500).json({ error: "Failed to reseed database" });
  }
});

// ----------------------------
// Error Handling Middleware
// ----------------------------

// 404 handler
app.use((req, res) => {
  console.log(`404 - Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: "Not Found",
    message: `Route ${req.method} ${req.url} not found`,
    availableRoutes: [
      "GET /",
      "GET /api/health",
      "GET /api/subjects",
      "GET /api/grades",
      "GET /api/content",
      "POST /api/content",
      "GET /api/glossary",
      "POST /api/glossary",
      "GET /api/past-papers",
      "POST /api/past-papers",
      "GET /api/past-papers/:id/download",
      "GET /api/languages",
      "POST /api/translate",
      "POST /api/translate-file",
      "GET /api/migrate/status",
      "POST /api/migrate/past-papers",
      "POST /api/migrate/content",
      "GET /api/debug/stats",
      "POST /auth/login",
      "POST /auth/register"


    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error.name === 'CastError') {
    return res.status(400).json({ error: "Invalid ID format" });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({ error: "Duplicate entry" });
  }
  
  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: "File too large. Maximum size is 10MB" });
    }
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ 
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong"
  });
});

// ----------------------------
// Server Startup
// ----------------------------

// Start server
async function startServer() {
  try {
    // Initialize DB
    const dbInit = await initDB();
    dbModels = dbInit.models;
    dbServices = dbInit.services;
    console.log("✅ Database initialized successfully");

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 AfriIntelligence API server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔗 Migration status: http://localhost:${PORT}/api/migrate/status`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => server.close(() => process.exit(0)));
    process.on("SIGINT", () => server.close(() => process.exit(0)));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;