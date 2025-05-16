// server.js or index.ts

const express = require('express');
const bodyParser = require('body-parser');
const translate = require('@iamtraction/google-translate');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const pdfParse = require('pdf-parse');
const { Document, Packer, Paragraph } = require('docx');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

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

app.listen(PORT, () => {
  console.log(`Translation server running at http://localhost:${PORT}`);
});



const upload = multer({ dest: 'uploads/' });

app.post('/translate-file', upload.single('file'), async (req, res) => {
  const file = req.file;
  const targetLang = req.body.target;

  if (!file) return res.status(400).send('No file uploaded.');

  try {
    let text = '';

    // Handle PDF
    if (file.mimetype === 'application/pdf') {
      const dataBuffer = await fs.readFile(file.path);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    }

    // Handle DOCX
    else if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // Use `mammoth` if needed
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: file.path });
      text = result.value;
    } else {
      return res.status(400).send('Unsupported file type');
    }

    // Translate text
    const { text: translatedText } = await translate(text, { to: targetLang });

    // Generate new DOCX
    const doc = new Document({
      sections: [
        {
          children: translatedText
            .split('\n')
            .map((line) => new Paragraph(line.trim())),
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const outputPath = `translated_${Date.now()}.docx`;
    await fs.writeFile(outputPath, buffer);

    res.download(outputPath, (err) => {
      fs.remove(file.path);       // Clean up uploaded file
      fs.remove(outputPath);      // Clean up translated file
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Translation failed');
  }
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
