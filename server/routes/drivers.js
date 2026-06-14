const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, requireRole } = require('../auth');

router.get('/', requireAuth, (req, res) => {
  if (req.user.role === 'admin') {
    db.all('SELECT * FROM drivers', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
    return;
  }

  if (req.user.role === 'driver') {
    db.all('SELECT * FROM drivers WHERE id = ?', [req.user.driver_id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
    return;
  }

  res.status(403).json({ error: 'Forbidden' });
});

router.post('/', requireRole('admin'), (req, res) => {
  const {
    name,
    licence,
    monthly_salary,
    profile_picture,
    aadhaar,
    pan,
    pvc_status,
    address,
    contact_number,
    family_contact_number,
    emergency_contact,
    notes
  } = req.body;
  db.run(
    'INSERT INTO drivers (name, licence, monthly_salary, profile_picture, aadhaar, pan, pvc_status, address, contact_number, family_contact_number, emergency_contact, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, licence, monthly_salary || 0, profile_picture || null, aadhaar || null, pan || null, pvc_status || null, address || null, contact_number || null, family_contact_number || null, emergency_contact || null, notes || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

router.get('/:id', requireAuth, (req, res) => {
  db.get('SELECT * FROM drivers WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Driver not found' });
    if (req.user.role === 'driver' && String(req.user.driver_id) !== String(row.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(row);
  });
});

router.put('/:id', requireRole('admin'), (req, res) => {
  const id = req.params.id;
  const {
    name,
    licence,
    monthly_salary,
    profile_picture,
    aadhaar,
    pan,
    pvc_status,
    address,
    contact_number,
    family_contact_number,
    emergency_contact,
    notes
  } = req.body;
  db.run(
    `UPDATE drivers SET name = ?, licence = ?, monthly_salary = ?, profile_picture = ?, aadhaar = ?, pan = ?, pvc_status = ?, address = ?, contact_number = ?, family_contact_number = ?, emergency_contact = ?, notes = ? WHERE id = ?`,
    [name, licence, monthly_salary, profile_picture, aadhaar, pan, pvc_status, address, contact_number, family_contact_number, emergency_contact, notes, id],
    function(err){
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    }
  );
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.run('DELETE FROM drivers WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
