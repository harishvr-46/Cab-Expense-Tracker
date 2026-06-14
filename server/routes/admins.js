const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, requireRole } = require('../auth');
const { hashPassword } = require('../auth');

// Only super admins can manage admins
function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin' || req.user.admin_level !== 'super_admin') {
    return res.status(403).json({ error: 'Only super admins can manage admin users' });
  }
  next();
}

// Get all admins
router.get('/', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can view admin list' });
  }
  db.all('SELECT id, username, admin_level, created_by FROM users WHERE role = ?', ['admin'], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create a new admin (super admin only) - requires re-authentication via super_password
router.post('/', requireSuperAdmin, (req, res) => {
  const { username, password, admin_level, super_password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  if (!super_password) {
    return res.status(401).json({ error: 'Super admin password required to create new admin' });
  }

  // verify super_password matches the current user's password hash
  db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Authentication failed' });
    const providedHash = hashPassword(super_password);
    if (providedHash !== row.password_hash) {
      return res.status(401).json({ error: 'Super admin password is incorrect' });
    }

    // support extended admin roles
    const ALLOWED = ['super_admin','fleet_admin','finance_admin','operations_admin','viewer','sub_admin'];
    if (admin_level && !ALLOWED.includes(admin_level)) {
      return res.status(400).json({ error: 'Invalid admin level' });
    }
    const passwordHash = hashPassword(password);
    const level = admin_level || 'sub_admin';
    db.run(
      'INSERT INTO users (username, password_hash, role, admin_level, created_by) VALUES (?, ?, ?, ?, ?)',
      [username, passwordHash, 'admin', level, req.user.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: `Admin ${username} created with level ${level}` });
      }
    );
  });
});

// Update admin level (super admin only)
router.put('/:id', requireSuperAdmin, (req, res) => {
  const { admin_level } = req.body;
  const ALLOWED = ['super_admin','fleet_admin','finance_admin','operations_admin','viewer','sub_admin'];
  if (!admin_level || !ALLOWED.includes(admin_level)) {
    return res.status(400).json({ error: 'Invalid admin level' });
  }
  db.run(
    'UPDATE users SET admin_level = ? WHERE id = ? AND role = ?',
    [admin_level, req.params.id, 'admin'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    }
  );
});

// Delete admin (super admin only, cannot delete self)
router.delete('/:id', requireSuperAdmin, (req, res) => {
  if (String(req.params.id) === String(req.user.id)) {
    return res.status(400).json({ error: 'Cannot delete your own admin account' });
  }
  db.run('DELETE FROM users WHERE id = ? AND role = ?', [req.params.id, 'admin'], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
