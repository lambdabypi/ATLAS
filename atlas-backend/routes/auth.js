// routes/auth.js - Authentication API routes
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'atlas-development-secret-change-in-production';

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation Error', details: errors.array() });
  }
  next();
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access Denied', message: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid Token', message: 'Token is invalid or expired' });
    }
    req.user = user;
    next();
  });
};

// POST /auth/login
router.post('/login', [
  body('username').notEmpty().trim(),
  body('password').notEmpty()
], validateRequest, (req, res) => {
  try {
    const { username, password } = req.body;

    const user = db.prepare(`
      SELECT id, username, email, password_hash, role, full_name, is_active
      FROM users WHERE username = ? AND is_active = 1
    `).get(username);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Login Failed', message: 'Invalid username or password' });
    }

    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    const token = jwt.sign({
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name
    }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login Failed', message: 'An error occurred during login' });
  }
});

// GET /auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, email, role, full_name, created_at, last_login
      FROM users WHERE id = ? AND is_active = 1
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User Not Found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile', message: error.message });
  }
});

module.exports = { router, authenticateToken };
