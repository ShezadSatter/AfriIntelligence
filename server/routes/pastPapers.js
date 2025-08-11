const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Helper to validate query params (basic)
function isValidParam(param) {
  return typeof param === 'string' && param.trim() !== '';
}

router.get('/file', async (req, res) => {
  const { filePath } = req.query;
  if (!filePath) {
    return res.status(400).json({ error: 'Missing filePath query parameter' });
  }
  const absPath = path.join(__dirname, '..', 'data', 'papers', filePath);
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    res.sendFile(absPath);
  } catch (err) {
    res.status(404).json({ error: 'File not found' });
  }
});

module.exports = router;
