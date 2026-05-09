const express = require('express');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { Resume } = require('../models');
const router = express.Router();

router.use(authenticate);

router.post('/upload', upload.single('resume'), handleUploadError, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const resume = await Resume.create({
      userId: req.user.id,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
    res.status(201).json({ message: 'Resume uploaded', resume: { id: resume.id, originalName: resume.originalName, fileSize: resume.fileSize } });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const resumes = await Resume.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json({ resumes });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    if (fs.existsSync(resume.filePath)) fs.unlinkSync(resume.filePath);
    await resume.destroy();
    res.json({ message: 'Resume deleted' });
  } catch (err) { next(err); }
});

module.exports = router;