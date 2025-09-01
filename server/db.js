// db.js - Consolidated Database Configuration
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { promises as fs } from "fs";


dotenv.config();

// ----------------------------
// Connection Helper
// ----------------------------
export async function connectDB(uri) {
  if (!uri) throw new Error("MONGODB_URI is required");
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  
  try {
    await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ Connected to MongoDB: ${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

// Common helpers
const requiredString = { type: String, required: true, trim: true };
const optionalString = { type: String, trim: true };

// Auto timestamps options
const ts = { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } };

// ----------------------------
// User Schema (Unified for students, teachers, admins)
// ----------------------------
const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^(st|t|a)[A-Za-z0-9_-]+$/, "userId must start with 'st', 't', or 'a'."],
    },
    role: { 
      type: String, 
      enum: ["student", "teacher", "admin"], 
      required: true 
    },
    name: requiredString,
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    passwordHash: optionalString, // for future auth implementation
    
    // Student-specific fields
    grade: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Grade",
      required: function() { return this.role === 'student'; }
    },
    
    // Teacher-specific fields
    subjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject"
    }],
    
    // Common fields
    isActive: { type: Boolean, default: true },
  },
  ts
);

// Only define indexes once - removed duplicate definitions
userSchema.index({ role: 1 });

// ----------------------------
// Subject Schema
// ----------------------------
const subjectSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    }, // Mathematics, Economics, Life Sciences
    code: { 
      type: String, 
      unique: true, 
      trim: true, 
      sparse: true 
    }, // e.g., "MATH", "ECON", "LIFE"
    slug: { 
      type: String, 
      unique: true, 
      trim: true 
    }, // e.g., "mathematics", "economics", "life-science"
    category: { 
      type: String, 
      default: "General", 
      trim: true 
    },
    description: optionalString,
    isActive: { type: Boolean, default: true },
    paperCount: { type: Number, default: 0 }, // maintained by service
  },
  ts
);

// Removed duplicate index definitions - unique: true already creates indexes

// Generate slug before saving
subjectSchema.pre('save', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
  next();
});

// ----------------------------
// Grade Schema
// ----------------------------
const gradeSchema = new mongoose.Schema(
  {
    level: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 12,
      unique: true 
    }, // 10, 11, 12
    description: optionalString,
    isActive: { type: Boolean, default: true },
  },
  ts
);

// Removed duplicate index - unique: true already creates the index

// ----------------------------
// Content Schema (Glossary/Definitions)
// ----------------------------





// ----------------------------
// DocumentFile Schema (File references)
// ----------------------------
const documentFileSchema = new mongoose.Schema(
  {
    filename: requiredString,
    originalName: optionalString, // Original filename when uploaded
    mimeType: requiredString,
    size: { type: Number, required: true },
    
    // Storage strategy
    strategy: { 
      type: String, 
      enum: ["local", "gridfs", "s3", "vercel"], 
      required: true 
    },
    
    // Local/URL storage
    filePath: optionalString, // Local file path or external URL
    
    // GridFS storage
    gridfsId: { 
      type: mongoose.Schema.Types.ObjectId,
      sparse: true 
    },
    
    // Cloud storage
    cloudUrl: optionalString,
    
    // Metadata
    checksum: optionalString,
    uploadedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    isActive: { type: Boolean, default: true },
  },
  ts
);

documentFileSchema.index({ filename: 1 });
// Removed duplicate gridfsId index - sparse: true already creates it

// ----------------------------
// PastPaper Schema
// ----------------------------
const pastPaperSchema = new mongoose.Schema(
  {
    subject: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Subject", 
      required: true 
    },
    grade: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Grade", 
      required: true 
    },
    year: { 
      type: Number, 
      required: true, 
      min: 1900, 
      max: new Date().getFullYear() + 1 
    },
    paperType: { 
      type: String, 
      enum: ["p1", "p2", "p3"], 
      required: true 
    },
    
    // File reference
    file: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "DocumentFile", 
      required: true 
    },
    
    // Legacy support for direct file URLs
    fileUrl: optionalString, // For backward compatibility
    
    // Metadata
    title: optionalString, // e.g., "Mathematics P1 Nov 2023"
    description: optionalString,
    downloadCount: { type: Number, default: 0 },
    lastDownloadedAt: { type: Date },
    uploadedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    isActive: { type: Boolean, default: true },
  },
  ts
);

pastPaperSchema.index({ subject: 1, grade: 1, year: 1, paperType: 1 }, { unique: true });
pastPaperSchema.index({ downloadCount: -1 });
pastPaperSchema.index({ year: -1 });

// Auto-generate title if not provided
pastPaperSchema.pre('save', async function(next) {
  if (!this.title && (this.isModified('subject') || this.isModified('paperType') || this.isModified('year'))) {
    try {
      await this.populate('subject');
      this.title = `${this.subject.name} ${this.paperType.toUpperCase()} ${this.year}`;
    } catch (error) {
      // Continue without title if population fails
    }
  }
  next();
});

// ----------------------------
// Language Schema (for translation features)
// ----------------------------
const languageSchema = new mongoose.Schema(
  {
    name: requiredString, // English, Zulu, Sepedi, etc.
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    }, // 'en', 'zu', 'nso', etc.
    isActive: { type: Boolean, default: true },
  },
  ts
);

// Removed duplicate index - unique: true already creates it

// ----------------------------
// Translation Schema
// ----------------------------
const translationSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    sourceLang: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Language", 
      required: true 
    },
    targetLang: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Language", 
      required: true 
    },
    
    // Text translation
    sourceText: optionalString,
    translatedText: optionalString,
    
    // File translation
    sourceFile: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "DocumentFile" 
    },
    outputFile: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "DocumentFile" 
    },
    
    // Status tracking
    status: { 
      type: String, 
      enum: ["queued", "processing", "done", "failed"], 
      default: "done" 
    },
    quality: { 
      type: Number, 
      min: 0, 
      max: 1 
    }, // confidence score
    errorMessage: optionalString, // for failed translations
  },
  ts
);

translationSchema.index({ user: 1, createdAt: -1 });
translationSchema.index({ sourceLang: 1, targetLang: 1 });
translationSchema.index({ status: 1 });

// ----------------------------
// Model Registration
// ----------------------------
export const models = {
  User: mongoose.models.User || mongoose.model("User", userSchema),
  Subject: mongoose.models.Subject || mongoose.model("Subject", subjectSchema),
  Grade: mongoose.models.Grade || mongoose.model("Grade", gradeSchema),
  DocumentFile: mongoose.models.DocumentFile || mongoose.model("DocumentFile", documentFileSchema),
  PastPaper: mongoose.models.PastPaper || mongoose.model("PastPaper", pastPaperSchema),
  Language: mongoose.models.Language || mongoose.model("Language", languageSchema),
  Translation: mongoose.models.Translation || mongoose.model("Translation", translationSchema),
};

// ----------------------------
// Seeding Functions
// ----------------------------
export async function seedBasics() {
  const { Subject, Grade, Language } = models;

  try {
    const glossaryDir = path.join(process.cwd(), "glossary");
    const dirents = await fs.readdir(glossaryDir, { withFileTypes: true });
    const subjectDirs = dirents.filter(d => d.isDirectory());

    // ----------------------------
    // 1️⃣ Seed subjects dynamically
    // ----------------------------
    for (const dirent of subjectDirs) {
      const slug = dirent.name.toLowerCase();
      const name = slug.charAt(0).toUpperCase() + slug.slice(1);
      const code = slug.slice(0, 4).toUpperCase();

      await Subject.findOneAndUpdate(
        { slug },
        { $setOnInsert: { name, code, slug } },
        { upsert: true, new: true }
      );
    }
    console.log("✅ Subjects seeded dynamically");

    // ----------------------------
    // 2️⃣ Seed grades dynamically
    // ----------------------------
    const gradesSet = new Set();
    for (const dirent of subjectDirs) {
      const indexFile = path.join(glossaryDir, dirent.name, "index.json");
      try {
        await fs.access(indexFile); // check if exists
        const data = JSON.parse(await fs.readFile(indexFile, "utf-8"));
        Object.keys(data).forEach(grade => gradesSet.add(grade));
      } catch {
        // skip if file does not exist or cannot read
      }
    }

    for (const gradeStr of gradesSet) {
      const level = parseInt(gradeStr.replace("grade", ""), 10);
      if (!isNaN(level)) {
        await Grade.findOneAndUpdate(
          { level },
          { $setOnInsert: { level, description: `Grade ${level}` } },
          { upsert: true, new: true }
        );
      }
    }
    console.log("✅ Grades seeded dynamically");

    // ----------------------------
    // 3️⃣ Seed languages
    // ----------------------------
    const languages = [
      { name: "English", code: "en" },
      { name: "Zulu", code: "zu" },
      { name: "Sepedi", code: "nso" },
      { name: "Tsonga", code: "ts" },
      { name: "Tshivenda", code: "ve" },
      { name: "Afrikaans", code: "af" },
    ];

    for (const lang of languages) {
      await Language.findOneAndUpdate(
        { code: lang.code },
        { $setOnInsert: lang },
        { upsert: true, new: true }
      );
    }
    console.log("✅ Languages seeded");

  } catch (error) {
    console.error("❌ Error dynamically seeding basic data:", error);
    throw error;
  }
}


// ----------------------------
// Database Services
// ----------------------------
export const services = {
  // Content services
  async createContent({ subjectId, gradeId, term, definition, example, context, category, languageCode = 'en', uploadedBy }) {
    const { Content } = models;
    return Content.create({
      subject: subjectId,
      grade: gradeId,
      term,
      definition,
      example,
      context,
      category,
      languageCode,
      uploadedBy,
    });
  },

  async getContent({ subjectSlug, gradeLevel, search, limit = 50, page = 1 }) {
    const { Content, Subject, Grade } = models;
    const filter = { isActive: true };
    
    if (subjectSlug) {
      const subject = await Subject.findOne({ slug: subjectSlug });
      if (subject) filter.subject = subject._id;
    }
    
    if (gradeLevel) {
      const grade = await Grade.findOne({ level: gradeLevel });
      if (grade) filter.grade = grade._id;
    }
    
    if (search) {
      filter.$text = { $search: search };
    }
    
    const skip = (page - 1) * limit;
    const content = await Content.find(filter)
      .populate('subject', 'name slug')
      .populate('grade', 'level')
      .populate('uploadedBy', 'name')
      .sort({ term: 1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Content.countDocuments(filter);
    
    return {
      content,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // Past Papers services
  async createPastPaper({ subjectId, gradeId, year, paperType, fileId, fileUrl, uploadedBy }) {
    const { PastPaper, DocumentFile } = models;
    
    let fileDoc = null;
    if (fileId) {
      fileDoc = await DocumentFile.findById(fileId);
      if (!fileDoc) throw new Error("DocumentFile not found");
    }

    return PastPaper.findOneAndUpdate(
      { subject: subjectId, grade: gradeId, year, paperType },
      { 
        $set: { 
          ...(fileDoc && { file: fileDoc._id }),
          ...(fileUrl && { fileUrl }),
          uploadedBy 
        } 
      },
      { upsert: true, new: true }
    ).populate('subject grade file');
  },

  async getPastPapers({ subjectSlug, gradeLevel, year, paperType, limit = 50, page = 1 }) {
    const { PastPaper, Subject, Grade } = models;
    const filter = { isActive: true };
    
    if (subjectSlug) {
      const subject = await Subject.findOne({ slug: subjectSlug });
      if (subject) filter.subject = subject._id;
    }
    
    if (gradeLevel) {
      const grade = await Grade.findOne({ level: gradeLevel });
      if (grade) filter.grade = grade._id;
    }
    
    if (year) filter.year = year;
    if (paperType) filter.paperType = paperType;
    
    const skip = (page - 1) * limit;
    const papers = await PastPaper.find(filter)
      .populate('subject', 'name slug')
      .populate('grade', 'level')
      .populate('file')
      .sort({ year: -1, paperType: 1 })
      .skip(skip)
      .limit(limit);
      
    const total = await PastPaper.countDocuments(filter);
    
    return {
      papers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  async recordDownload(paperId) {
    const { PastPaper } = models;
    await PastPaper.updateOne(
      { _id: paperId }, 
      { 
        $inc: { downloadCount: 1 }, 
        $set: { lastDownloadedAt: new Date() } 
      }
    );
  },

  // File services
  async createDocumentFile({ filename, originalName, mimeType, size, strategy, filePath, gridfsId, cloudUrl, uploadedBy }) {
    const { DocumentFile } = models;
    return DocumentFile.create({
      filename,
      originalName,
      mimeType,
      size,
      strategy,
      filePath,
      gridfsId,
      cloudUrl,
      uploadedBy,
    });
  },

  // User services
  async createUser({ userId, role, name, email, grade, subjects }) {
    const { User } = models;
    return User.create({
      userId,
      role,
      name,
      email,
      ...(grade && { grade }),
      ...(subjects && { subjects }),
    });
  },

  // Utility services
  async getSubjects() {
    const { Subject } = models;
    return Subject.find({ isActive: true }).sort({ name: 1 });
  },

  async getGrades() {
    const { Grade } = models;
    return Grade.find({ isActive: true }).sort({ level: 1 });
  },

  async getLanguages() {
    const { Language } = models;
    return Language.find({ isActive: true }).sort({ name: 1 });
  },
};

// ----------------------------
// Initialization Function
// ----------------------------
export async function initDB() {
  const uri = process.env.MONGODB_URI;
  const conn = await connectDB(uri);
  await seedBasics();
  return { connection: conn, models, services };

}

