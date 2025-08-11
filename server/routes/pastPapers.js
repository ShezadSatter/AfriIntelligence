const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Helper to validate query params (basic)
function isValidParam(param) {
  return typeof param === 'string' && param.trim() !== '';
}

router.get('/', async (req, res) => {
  const { grade, subject, year } = req.query;

  if (!isValidParam(grade) || !isValidParam(subject) || !isValidParam(year)) {
    return res.status(400).json({ error: 'Missing or invalid query parameters: grade, subject, year are required' });
  }

  try {
    const filePath = path.join(__dirname, '..', 'data', 'pastPapers.json');
    const dataRaw = await fs.readFile(filePath, 'utf8');
    const pastPapers = JSON.parse(dataRaw);

    const paper = pastPapers.find(
      (p) =>
        p.grade === grade &&
        p.subject.toLowerCase() === subject.toLowerCase() &&
        p.year === year
    );

    if (!paper) {
      return res.status(404).json({ error: 'Past paper not found for the specified criteria' });
    }

    res.json(paper);
  } catch (error) {
    console.error('Error reading past papers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/file', async (req, res) => {
  const { filePath, preview } = req.query;
  if (!filePath) {
    return res.status(400).json({ error: 'Missing filePath query parameter' });
  }
  const absPath = path.join(__dirname, '..', 'data', 'pdfs', filePath);
  try {
    res.setHeader('Content-Type', 'application/pdf');
    if (preview === 'true') {
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    }
    res.sendFile(absPath);
  } catch (err) {
    res.status(404).json({ error: 'File not found' });
  }
});

// ...existing code...

module.exports = router;
