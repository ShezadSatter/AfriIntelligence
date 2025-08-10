const express = require('express');
const bodyParser = require('body-parser');
const translate = require('@iamtraction/google-translate');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const pdfParse = require('pdf-parse');
const { Document, Packer, Paragraph } = require('docx');
const path = require('path');
const pastPapersRoute = require('./routes/pastPapers');


const app = express();
const PORT = process.env.PORT || 3000;

app.use('/pdfs', express.static(path.join(__dirname, 'data/pdfs')));


// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Simple validation helper to prevent directory traversal and invalid chars
const isValidName = (name) => /^[a-zA-Z0-9-_\.]+$/.test(name);

// --- Middleware ---

// Body parser
app.use(bodyParser.json());

// CORS whitelist
const allowedOrigins = [
  "http://localhost:3000",                  // Dev
  "http://localhost:5173",                  // Dev
  "https://afri-intelligence.vercel.app",  // Prod frontend
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Deny disallowed origins gracefully
      callback(null, false);
    }
  }
}));

// --- Routes ---

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Translate plain text
app.post('/translate', async (req, res) => {
  const { q, target } = req.body;

  if (!q || !target) {
    return res.status(400).json({ error: 'Missing required parameters' });
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
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Translate uploaded file (PDF or DOCX)
app.post('/translate-file', upload.single('file'), async (req, res) => {
  const file = req.file;
  const targetLang = req.body.target;

  if (!file) return res.status(400).send('No file uploaded.');
  if (!targetLang) return res.status(400).send('No target language specified.');

  try {
    let text = '';

    // PDF handling
    if (file.mimetype === 'application/pdf') {
      const dataBuffer = await fs.readFile(file.path);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    }
    // DOCX handling
    else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: file.path });
      text = result.value;
    } else {
      await fs.remove(file.path);
      return res.status(400).send('Unsupported file type');
    }

    // Translate extracted text
    const { text: translatedText } = await translate(text, { to: targetLang });

    // Create translated DOCX document
    const doc = new Document({
      sections: [
        {
          children: translatedText
            .split('\n')
            .filter(line => line.trim() !== '')
            .map((line) => new Paragraph(line.trim())),
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.join('uploads', `translated_${Date.now()}.docx`);
    await fs.writeFile(outputPath, buffer);

    // Send file and cleanup after response finishes
    res.download(outputPath, async (err) => {
      try {
        await fs.remove(file.path);
        await fs.remove(outputPath);
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr);
      }
      if (err) {
        console.error('Download error:', err);
      }
    });
  } catch (error) {
    console.error('File translation error:', error);
    // Cleanup uploaded file if error occurs
    if (file && file.path) {
      await fs.remove(file.path);
    }
    res.status(500).send('Translation failed');
  }
});

// Serve master glossary index.json (list of all subjects)
app.get("/api/glossary/index.json", async (req, res) => {
  const filePath = path.join(__dirname, "glossary", "index.json");
  try {
    await fs.access(filePath);
    const data = await fs.readFile(filePath, "utf-8");
    res.type("application/json").send(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      res.status(404).json({ error: "Master index file not found" });
    } else {
      res.status(500).json({ error: "Failed to read master index file" });
    }
  }
});

// Serve subject-specific glossary index.json
app.get("/api/glossary/:subject/index.json", async (req, res) => {
  const { subject } = req.params;
  if (!isValidName(subject)) {
    return res.status(400).json({ error: "Invalid subject parameter" });
  }

  const filePath = path.join(__dirname, "glossary", subject, "index.json");
  try {
    await fs.access(filePath);
    const data = await fs.readFile(filePath, "utf-8");
    res.type("application/json").send(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      res.status(404).json({ error: `Index file not found for subject: ${subject}` });
    } else {
      res.status(500).json({ error: "Failed to read subject index file" });
    }
  }
});

// Serve topic file
app.get("/api/glossary/:subject/:grade/:fileName", async (req, res) => {
  const { subject, grade, fileName } = req.params;
  if (![subject, grade, fileName].every(isValidName)) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const filePath = path.join(__dirname, "glossary", subject, grade, fileName);
  try {
    await fs.access(filePath);
    const data = await fs.readFile(filePath, "utf-8");
    res.type("application/json").send(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      res.status(404).json({ error: "Topic file not found" });
    } else {
      res.status(500).json({ error: "Failed to read topic file" });
    }
  }
});

app.use('/api/past-papers', pastPapersRoute);


// Catch-all for unhandled routes
app.use((req, res) => {
  console.log(`Unhandled request: ${req.method} ${req.url}`);
  res.status(404).send('Not found');
});



// Start server
app.listen(PORT, () => {
  console.log(`Translation server running at port ${PORT}`);
});
