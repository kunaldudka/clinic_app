const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/database');
const db = getDb();
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  const user = db.prepare(
    'SELECT * FROM users WHERE username = ? AND is_deleted = 0'
  ).get(username);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, role, full_name FROM users WHERE id = ? AND is_deleted = 0'
  ).get(req.user.id);

  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PUT /api/auth/profile — update own profile
router.put('/profile', authenticateToken, [
  body('full_name').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('username').optional().trim().notEmpty().withMessage('Username cannot be empty'),
  body('new_password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('current_password').custom((value, { req }) => {
    if (req.body.new_password && !value) {
      throw new Error('Current password is required to set a new password');
    }
    return true;
  }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const user = db.prepare(
    'SELECT * FROM users WHERE id = ? AND is_deleted = 0'
  ).get(req.user.id);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const { full_name, username, current_password, new_password } = req.body;

  // If changing username, make sure it's not taken by someone else
  if (username && username !== user.username) {
    const taken = db.prepare(
      'SELECT id FROM users WHERE username = ? AND id != ? AND is_deleted = 0'
    ).get(username, user.id);
    if (taken) return res.status(409).json({ error: 'Username is already taken' });
  }

  // Verify current password if changing password
  if (new_password) {
    if (!bcrypt.compareSync(current_password, user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
  }

  const newHash = new_password ? bcrypt.hashSync(new_password, 10) : user.password_hash;

  db.prepare(`
    UPDATE users SET
      full_name = COALESCE(?, full_name),
      username  = COALESCE(?, username),
      password_hash = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(full_name || null, username || null, newHash, user.id);

  const updated = db.prepare(
    'SELECT id, username, role, full_name FROM users WHERE id = ?'
  ).get(user.id);

  res.json(updated);
});

module.exports = router;
