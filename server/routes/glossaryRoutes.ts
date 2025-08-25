// routes/glossaryRoutes.js
import express from 'express';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';


const router = express.Router();

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/glossary/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept JSON files only
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed for glossary uploads.'));
    }
  }
});

// Import database models and services - these will be injected
let dbModels, dbServices;

// Middleware to inject database dependencies
export const injectDB = (models, services) => {
  dbModels = models;
  dbServices = services;
};

// Upload glossary content directly to database
router.post('/upload', upload.single('glossaryFile'), async (req, res) => {
  try {
    console.log('=== Glossary Upload Started ===');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!dbModels || !dbServices) {
      console.error('Database models or services not available');
      return res.status(500).json({ error: 'Database not properly initialized' });
    }

    console.log('Processing file:', req.file.originalname);
    
    // Read and parse the uploaded JSON file
    const filePath = req.file.path;
    const fileContent = await fs.readFile(filePath, 'utf8');
    let glossaryData;
    
    try {
      glossaryData = JSON.parse(fileContent);
      console.log('JSON parsed successfully');
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      await fs.remove(filePath); // Clean up
      return res.status(400).json({ error: 'Invalid JSON file format' });
    }

    // Determine the subject from filename or request
    const { subjectSlug } = req.body;
    let subject;
    
    if (subjectSlug) {
      subject = await dbModels.Subject.findOne({ slug: subjectSlug });
    } else {
      // Try to extract subject from filename
      const filename = req.file.originalname.toLowerCase().replace('.json', '');
      subject = await dbModels.Subject.findOne({ 
        $or: [
          { slug: filename },
          { name: new RegExp(filename, 'i') }
        ]
      });
    }

    if (!subject) {
      await fs.remove(filePath);
      return res.status(400).json({ 
        error: 'Could not determine subject. Please specify subjectSlug in request or name file appropriately.' 
      });
    }

    console.log('Subject found:', subject.name);

    let totalUploaded = 0;
    let totalSkipped = 0;
    let errors = [];

    // Process the glossary data
    // Expected format: { "10": [...], "11": [...], "12": [...] }
    for (const [gradeLevel, terms] of Object.entries(glossaryData)) {
      console.log(`Processing grade ${gradeLevel}...`);
      
      // Find the grade
      const grade = await dbModels.Grade.findOne({ level: parseInt(gradeLevel) });
      if (!grade) {
        errors.push(`Grade ${gradeLevel} not found in database`);
        continue;
      }

      if (!Array.isArray(terms)) {
        errors.push(`Grade ${gradeLevel} data is not an array`);
        continue;
      }

      // Process each term
      for (const termData of terms) {
        try {
          if (!termData.term || !termData.definition) {
            errors.push(`Missing term or definition in grade ${gradeLevel}`);
            continue;
          }

          // Check if term already exists
          const existingTerm = await dbModels.Content.findOne({
            subject: subject._id,
            grade: grade._id,
            term: termData.term.trim()
          });

          if (existingTerm) {
            totalSkipped++;
            continue;
          }

          // Create new content entry
          await dbServices.createContent({
            subjectId: subject._id,
            gradeId: grade._id,
            term: termData.term.trim(),
            definition: termData.definition.trim(),
            example: termData.example?.trim() || null,
            context: termData.context?.trim() || null,
            category: termData.category?.trim() || null,
            languageCode: termData.languageCode || 'en',
            uploadedBy: req.user?._id || null
          });

          totalUploaded++;
          
        } catch (termError) {
          console.error(`Error processing term "${termData.term}":`, termError);
          errors.push(`Error processing term "${termData.term}": ${termError.message}`);
        }
      }
    }

    // Clean up uploaded file
    await fs.remove(filePath);

    console.log(`Upload completed: ${totalUploaded} uploaded, ${totalSkipped} skipped`);

    res.json({
      success: true,
      message: `Successfully uploaded ${totalUploaded} glossary terms to database`,
      stats: {
        subject: subject.name,
        uploaded: totalUploaded,
        skipped: totalSkipped,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : null // Limit errors shown
    });

  } catch (error) {
    console.error('Glossary upload error:', error);
    
    // Clean up file if it exists
    if (req.file?.path) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({ 
      error: 'Failed to upload glossary', 
      message: error.message 
    });
  }
});

// Bulk upload individual terms (alternative method)
router.post('/bulk', async (req, res) => {
  try {
    console.log('=== Bulk Glossary Upload ===');
    
    const { subjectSlug, gradeLevel, terms } = req.body;
    
    if (!subjectSlug || !gradeLevel || !Array.isArray(terms)) {
      return res.status(400).json({ 
        error: 'Missing required fields: subjectSlug, gradeLevel, terms (array)' 
      });
    }

    // Find subject and grade
    const subject = await dbModels.Subject.findOne({ slug: subjectSlug });
    const grade = await dbModels.Grade.findOne({ level: parseInt(gradeLevel) });

    if (!subject || !grade) {
      return res.status(400).json({ error: 'Subject or grade not found' });
    }

    let uploaded = 0;
    let skipped = 0;
    let errors = [];

    for (const termData of terms) {
      try {
        if (!termData.term || !termData.definition) {
          errors.push('Missing term or definition');
          continue;
        }

        // Check if exists
        const existing = await dbModels.Content.findOne({
          subject: subject._id,
          grade: grade._id,
          term: termData.term.trim()
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create new term
        await dbServices.createContent({
          subjectId: subject._id,
          gradeId: grade._id,
          term: termData.term.trim(),
          definition: termData.definition.trim(),
          example: termData.example?.trim() || null,
          context: termData.context?.trim() || null,
          category: termData.category?.trim() || null,
          languageCode: termData.languageCode || 'en',
          uploadedBy: req.user?._id || null
        });

        uploaded++;

      } catch (termError) {
        errors.push(`Error with term "${termData.term}": ${termError.message}`);
      }
    }

    res.json({
      success: true,
      message: `Bulk upload completed: ${uploaded} uploaded, ${skipped} skipped`,
      stats: { uploaded, skipped, errors: errors.length },
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Bulk upload failed', message: error.message });
  }
});

router.post("/upload", async (req, res) => {
  const { subject, grade, title, id, terms } = req.body;

  if (![subject, grade, title, id].every((s) => typeof s === "string" && s.trim())) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const dirPath = path.join(__dirname, "..", "glossary", subject, `grade${grade}`);
    await fsPromises.mkdir(dirPath, { recursive: true });

    const filePath = path.join(dirPath, `${id}.json`);

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
