const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

function generateTokens(userId) {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_r', { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create({ name, email, password });
    const tokens = generateTokens(user.id);
    res.status(201).json({ message: 'Account created', user: user.toSafeObject(), ...tokens });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid email or password' });
    const isValid = await user.validatePassword(password);
    if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });
    await user.update({ lastLogin: new Date() });
    const tokens = generateTokens(user.id);
    res.json({ message: 'Login successful', user: user.toSafeObject(), ...tokens });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;