const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const { Analysis, Resume, User } = require('../models');
const router = express.Router();

router.use(authenticate);

router.post('/', async (req, res, next) => {
  try {
    const { targetRole, company, jobDescription, resumeId, resumeText } = req.body;
    if (!targetRole) return res.status(400).json({ error: 'Target role is required' });
    if (!jobDescription) return res.status(400).json({ error: 'Job description is required' });
    if (!resumeId && !resumeText) return res.status(400).json({ error: 'Resume text or file required' });

    const analysis = await Analysis.create({
      userId: req.user.id,
      resumeId: resumeId || null,
      targetRole, company: company || null,
      jobDescription, status: 'processing',
    });

    let aiResponse;
    try {
      if (resumeId) {
        const resume = await Resume.findOne({ where: { id: resumeId, userId: req.user.id } });
        if (!resume) return res.status(404).json({ error: 'Resume not found' });
        const formData = new FormData();
        formData.append('file', fs.createReadStream(resume.filePath), resume.originalName);
        formData.append('job_description', jobDescription);
        formData.append('role', targetRole);
        aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/analyze`, formData, {
          headers: formData.getHeaders(), timeout: 60000,
        });
      } else {
        const formData = new FormData();
        formData.append('resume_text', resumeText);
        formData.append('job_description', jobDescription);
        formData.append('role', targetRole);
        aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/analyze-text`, formData, {
          headers: formData.getHeaders(), timeout: 60000,
        });
      }
    } catch (aiErr) {
      await analysis.update({ status: 'failed', errorMessage: aiErr.message });
      return res.status(503).json({ error: 'AI service unavailable. Make sure Python service is running.' });
    }

    const raw = aiResponse.data.result || aiResponse.data;
    let parsed = {};
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw.replace(/```json|```/g, '').trim()) : raw;
    } catch {
      await analysis.update({ status: 'failed', errorMessage: 'Failed to parse AI response' });
      return res.status(500).json({ error: 'Failed to parse AI results' });
    }

    await analysis.update({
      status: 'completed',
      overallScore: parsed.overall_score,
      atsScore: parsed.ats_score,
      keywordMatch: parsed.keyword_match,
      experienceMatch: parsed.experience_match,
      interviewReadiness: parsed.interview_readiness,
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      matchedSkills: parsed.matched_skills || [],
      missingSkills: parsed.missing_skills || [],
      partialSkills: parsed.partial_skills || [],
      suggestions: parsed.suggestions || [],
      roleMatches: parsed.role_matches || [],
      summary: parsed.summary || '',
      rawResponse: JSON.stringify(parsed),
    });

    await User.increment('analysisCount', { where: { id: req.user.id } });
    res.json({ message: 'Analysis completed', analysisId: analysis.id, results: parsed });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });
    res.json({ analysis });
  } catch (err) { next(err); }
});

module.exports = router;