const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { hashPassword, createSession } = require('../auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT id, username, password_hash, role, admin_level, driver_id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user || user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const sessionUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      admin_level: user.admin_level,
      driver_id: user.driver_id,
    };
    const token = createSession(sessionUser);
    res.json({ token, user: sessionUser });
  });
});

router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(req.user);
});

router.post('/logout', (req, res) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    delete require('../auth').sessions[token];
  }
  res.json({ ok: true });
});

module.exports = router;
