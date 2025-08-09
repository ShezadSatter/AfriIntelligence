const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const dataFile = path.join(__dirname, '../data/pastPapers.json');

router.get('/', (req, res) => {
  const { grade, subject, year } = req.query;

  if (!grade || !subject || !year) {
    return res.status(400).json({ error: 'Missing grade, subject, or year parameter' });
  }

  fs.readFile(dataFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const papers = JSON.parse(data);
    const paper = papers.find(
      p =>
        p.grade === grade &&
        p.subject.toLowerCase() === subject.toLowerCase() &&
        p.year.toString() === year
    );

    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    res.json({ fileUrl: paper.fileUrl });
  });
});

module.exports = router;
