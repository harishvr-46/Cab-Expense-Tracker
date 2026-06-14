const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireRole } = require('../auth');

router.get('/', requireRole('admin'), (req, res) => {
  db.all('SELECT * FROM owners', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/', requireRole('admin'), (req, res) => {
  const { name, phone, email } = req.body;
  db.run(
    'INSERT INTO owners (name, phone, email) VALUES (?, ?, ?)',
    [name, phone, email],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

module.exports = router;
