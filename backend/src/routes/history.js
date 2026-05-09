const express = require('express');
const { authenticate } = require('../middleware/auth');
const { Analysis } = require('../models');
const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const { count, rows } = await Analysis.findAndCountAll({
      where: { userId: req.user.id, status: 'completed' },
      order: [['createdAt', 'DESC']],
      limit, offset: (page - 1) * limit,
      attributes: ['id', 'targetRole', 'company', 'overallScore', 'atsScore', 'keywordMatch', 'status', 'createdAt'],
    });
    res.json({ analyses: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
});

router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const total = await Analysis.count({ where: { userId, status: 'completed' } });
    const best = await Analysis.findOne({
      where: { userId, status: 'completed' },
      order: [['overallScore', 'DESC']],
      attributes: ['overallScore', 'targetRole'],
    });
    const recent = await Analysis.findAll({
      where: { userId, status: 'completed' },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'targetRole', 'company', 'overallScore', 'atsScore', 'createdAt'],
    });
    res.json({ stats: { totalAnalyses: total, bestScore: best?.overallScore ?? 0, bestRole: best?.targetRole ?? null }, recentAnalyses: recent });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });
    await analysis.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;