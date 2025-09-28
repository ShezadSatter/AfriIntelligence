//index.js
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
import glossaryRoutes from "./routes/glossaryRoutes.js"; // Note: change .ts to .js
//import pdfParse from "pdf-parse";
import { initDB, models, services } from "./db.js";
import pastPaperRoutes from './routes/pastPapers.js';

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
let dbModels, dbServices;

// ----------------------------
// Middleware Setup (before routes)
// ----------------------------

// Body parser
// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:3001",
  "https://afri-intelligence.vercel.app",
  "https://afri-intelligence.onrender.com",
];

app.use(cors({
  origin: function (origin, callback) {
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
  dest: path.join(process.cwd(), "uploads"),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
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

// ----------------------------
// Start server and register routes AFTER DB init
// ----------------------------
async function startServer() {
  try {
    // Initialize DB first
    const dbInit = await initDB();
    dbModels = dbInit.models;
    dbServices = dbInit.services;
    console.log("✅ Database initialized successfully");

    // NOW register routes after DB is ready
    registerRoutes();

    // Start Express
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

function registerRoutes() {
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

  // Add this route temporarily for debugging
app.get("/api/debug/database", async (req, res) => {
  try {
    const subjects = await dbModels.Subject.find().limit(5);
    const grades = await dbModels.Grade.find().limit(5);
    
    res.json({
      subjects,
      grades,
      subjectCount: await dbModels.Subject.countDocuments(),
      gradeCount: await dbModels.Grade.countDocuments()
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
}); 

  // ----------------------------
  // Auth Routes
  // ----------------------------
  app.use('/auth', authRoutes);

  // ----------------------------
  // Glossary Routes (your main issue)
  // ----------------------------
  app.use("/api", glossaryRoutes);
  // Add debugging middleware for glossary uploads
  app.use('/api/glossary/upload', (req, res, next) => {
  console.log('🔍 Upload request received:');
  console.log('Headers:', req.headers);
  console.log('Body type:', typeof req.body);
  console.log('Body:', req.body);
  console.log('Raw body length:', req.body ? Object.keys(req.body).length : 0);
  next();
});

  
// Add this temporary debug route in your registerRoutes() function
app.get("/api/debug/routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: middleware.regexp.source + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json(routes);
});



// Get grades for a specific subject (quick fix: return all active grades)
// Add this in your registerRoutes() function in index.js
app.get("/api/grades/:subject", async (req, res) => {
  try {
    const { subject } = req.params;
    console.log("📍 Grades route hit for subject:", subject);

    // Check if subject exists
    const subj = await dbModels.Subject.findOne({ slug: subject.toLowerCase() });
    if (!subj) {
      console.log("❌ Subject not found:", subject);
      return res.status(404).json({ error: "Subject not found" });
    }

    console.log("✅ Subject found:", subj.name);

    // Return all active grades
    const grades = await dbModels.Grade.find({ isActive: true })
      .sort({ level: 1 })
      .lean();

    console.log("✅ Grades found:", grades.length);
    res.json(grades);
  } catch (error) {
    console.error("❌ Error fetching grades:", error);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
});

  // ----------------------------
  // API Routes - Grades
  // ----------------------------
  app.get("/api/grades", async (req, res) => {
    try {
      const grades = await dbServices.getGrades();
      res.json(grades);
    } catch (error) {
      console.error("Error fetching grades:", error);
      res.status(500).json({ error: "Failed to fetch grades" });
    }
  });
  // Get past papers filters
 app.get("/api/past-papers/filters", async (req, res) => {
  try {
    // Bypass services and query directly
    const grades = await dbModels.Grade.find({ isActive: true })
      .select('_id level description')
      .sort({ level: 1 })
      .lean();
      
    const subjects = await dbModels.Subject.find({ isActive: true })
      .select('_id name slug')  
      .sort({ name: 1 })
      .lean();
      
    const years = [2025, 2024, 2023, 2022, 2021, 2020];
    
    console.log("Direct query - Grades:", grades);
    console.log("Direct query - Subjects:", subjects);
    
    res.json({
      grades,
      subjects, 
      years
    });
  } catch (error) {
    console.error("Error fetching filters:", error);
    res.status(500).json({ error: "Failed to fetch filters" });
  }
});

// Add this as a test route
app.get("/api/test-filters", async (req, res) => {
  try {
    // Direct database queries
    const grades = await dbModels.Grade.find({ isActive: true }).lean();
    const subjects = await dbModels.Subject.find({ isActive: true }).lean();
    
    console.log("Test route - Raw grades from DB:", grades);
    console.log("Test route - Raw subjects from DB:", subjects);
    
    res.json({
      grades: grades,
      subjects: subjects,
      message: "This is the test route with direct queries"
    });
  } catch (error) {
    console.error("Test route error:", error);
    res.status(500).json({ error: error.message });
  }
});

 // ----------------------------
  // Past Papers Routes
  // ----------------------------
  app.use('/api/past-papers', pastPaperRoutes);

  // Upload new past paper
  app.post("/api/past-papers/upload", upload.single('file'), async (req, res) => {
    try {
      const { grade, subject, year, paper, language } = req.body;
      const file = req.file;
      
      if (!grade || !subject || !year || !paper || !language || !file) {
        return res.status(400).json({ 
          error: "Missing required fields: grade, subject, year, paper, language, and file" 
        });
      }
      
      // Validate paper type
      if (!['p1', 'p2', 'p3'].includes(paper)) {
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
        subjectId: subject,
        gradeId: grade,
        year: parseInt(year),
        paperType: paper,
        fileId: documentFile._id,
        uploadedBy: req.user?._id
      });
      
      res.status(201).json({ message: "Past paper uploaded successfully", pastPaper });
    } catch (error) {
      console.error("Error uploading past paper:", error);
      if (req.file?.path) {
        await fs.remove(req.file.path).catch(console.error);
      }
      res.status(500).json({ error: "Failed to upload past paper" });
    }
  });

  // ----------------------------
  // Translation Routes
  // ----------------------------
  app.get("/api/languages", async (req, res) => {
    try {
      const languages = await dbServices.getLanguages();
      res.json(languages);
    } catch (error) {
      console.error("Error fetching languages:", error);
      res.status(500).json({ error: "Failed to fetch languages" });
    }
  });

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
  console.log("🔍 Translate-file route started");
  console.log("File:", req.file);
  console.log("Target language:", req.body.target);
  
  const file = req.file;
  const targetLang = req.body.target;

  if (!file) {
    console.log("❌ No file uploaded");
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  if (!targetLang) {
    console.log("❌ No target language");
    await fs.remove(file.path).catch(() => {});
    return res.status(400).json({ error: "No target language specified" });
  }

  try {
    console.log("🔄 Starting file processing...");
    let text = "";

   if (file.mimetype === "application/pdf") {
  console.log("Processing PDF file with pdf2json");
  try {
    const { default: PDF2JSON } = await import("pdf2json");
    const pdfParser = new PDF2JSON();
    
    // Add timeout to prevent hanging
    const parseTimeout = 30000; // 30 seconds
    
    text = await Promise.race([
      new Promise((resolve, reject) => {
        pdfParser.on("pdfParser_dataError", (errData) => {
          console.log("PDF parser error:", errData);
          reject(new Error(errData.parserError));
        });
        
        pdfParser.on("pdfParser_dataReady", (pdfData) => {
          console.log("PDF data received, processing text...");
          try {
            const extractedText = pdfData.Pages.map(page => 
              page.Texts.map(textItem => 
                textItem.R.map(r => decodeURIComponent(r.T)).join('')
              ).join(' ')
            ).join('\n');
            console.log("Text extraction completed, length:", extractedText.length);
            resolve(extractedText);
          } catch (textError) {
            console.log("Text extraction error:", textError);
            reject(textError);
          }
        });
        
        console.log("Starting PDF parsing...");
        pdfParser.loadPDF(file.path);
      }),
      
      // Timeout promise
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("PDF parsing timeout after 30 seconds")), parseTimeout)
      )
    ]);
    
    console.log("PDF parsed successfully, text length:", text.length);
  } catch (pdfError) {
    console.error("PDF processing failed:", pdfError);
    await fs.remove(file.path).catch(() => {});
    return res.status(500).json({
      error: "PDF processing failed",
      message: `PDF parsing error: ${pdfError.message}`
    });
  }
} else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      console.log("📝 Processing Word document");
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ path: file.path });
        text = result.value;
        console.log("✅ Word document processed, text length:", text.length);
      } catch (wordError) {
        console.error("❌ Word processing failed:", wordError);
        throw wordError;
      }
    } else {
      console.log("❌ Unsupported file type:", file.mimetype);
      throw new Error("Unsupported file type");
    }

    if (!text.trim()) {
      console.log("❌ No text extracted from file");
      throw new Error("No text found in uploaded file");
    }

   console.log("🔄 Starting translation...");
const translatedResult = await translate(text, { to: targetLang });
const translatedText = translatedResult.text;
console.log("✅ Translation completed");

console.log("🔄 Creating Word document...");
const doc = new Document({
  sections: [{
    children: translatedText
      .split("\n")
      .filter(line => line.trim() !== "")
      .map(line => new Paragraph(line.trim())),
  }],
});

console.log("📁 Ensuring upload directory exists...");
await fs.ensureDir(path.join(__dirname, "uploads"));

const outputPath = path.join(__dirname, "uploads", `translated_${Date.now()}.docx`);
console.log("💾 Converting to buffer...");
const buffer = await Packer.toBuffer(doc);

console.log("📝 Writing file...");
await fs.writeFile(outputPath, buffer);

console.log("⬇️ Starting download...");
res.download(outputPath, `translated_${file.originalname.replace(/\.[^/.]+$/, "")}.docx`, async (err) => {
  console.log("🧹 Cleaning up files...");
  await fs.remove(file.path).catch(() => {});
  await fs.remove(outputPath).catch(() => {});
  if (err) console.error("Download error:", err);
});
    
  } catch (err) {
    console.error("❌ Translation route error:", err);
    console.error("❌ Error stack:", err.stack);
    if (file?.path) await fs.remove(file.path).catch(() => {});
    res.status(500).json({
      error: "Translation failed",
      message: err.message,
    });
  }
});

  // ----------------------------
  // Migration Routes
  // ----------------------------
  app.get("/api/migrate/status", async (req, res) => {
    try {
      const stats = {
        subjects: await dbModels.Subject.countDocuments(),
        grades: await dbModels.Grade.countDocuments(),
        content: await dbModels.Content.countDocuments(),
        pastPapers: await dbModels.PastPaper.countDocuments(),
        documentFiles: await dbModels.DocumentFile.countDocuments(),
      };
      
      const jsonFiles = {
        pastPapersJson: await fs.pathExists(path.join(__dirname, 'pastPapers.json')),
        indexJson: await fs.pathExists(path.join(__dirname, 'index.json')),
        glossaryDir: await fs.pathExists(path.join(__dirname, 'glossary')),
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

  // ----------------------------
  // Static File Serving
  // ----------------------------
  app.use('/pdfs', express.static(path.join(__dirname, 'data', 'pdfs')));

  // ----------------------------
  // Debug Routes
  // ----------------------------
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

  // ----------------------------
  // Error Handling Middleware
  // ----------------------------
  app.use((req, res) => {
    console.log(`404 - Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: "Not Found",
      message: `Route ${req.method} ${req.url} not found`
    });
  });

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
}




// Start the server
startServer();
