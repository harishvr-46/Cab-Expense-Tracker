const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../auth');

router.get('/', requireAuth, (req, res) => {
  if (req.user.role === 'admin') {
    db.all('SELECT * FROM fuel_logs ORDER BY date DESC', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
    return;
  }

  if (req.user.role === 'driver') {
    db.all(
      `SELECT f.* FROM fuel_logs f JOIN vehicles v ON f.vehicle_id = v.id WHERE v.driver_id = ? ORDER BY f.date DESC`,
      [req.user.driver_id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      }
    );
    return;
  }

  res.status(403).json({ error: 'Forbidden' });
});

router.post('/', requireAuth, (req, res) => {
  const { date, vehicle_id, fuel_type, litres, amount } = req.body;
  db.run(
    'INSERT INTO fuel_logs (date, vehicle_id, fuel_type, litres, amount) VALUES (?, ?, ?, ?, ?)',
    [date, vehicle_id, fuel_type, litres, amount],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

router.delete('/:id', requireAuth, (req, res) => {
  db.get('SELECT * FROM fuel_logs WHERE id = ?', [req.params.id], (err, log) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!log) return res.status(404).json({ error: 'Fuel log not found' });
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete fuel logs' });
    }
    db.run('DELETE FROM fuel_logs WHERE id = ?', [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    });
  });
});

module.exports = router;
