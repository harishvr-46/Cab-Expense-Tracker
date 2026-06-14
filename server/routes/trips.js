const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../auth');

// Fare rules
function calculateFare(site, vehicleType, distanceKm) {
  if (site === 'Infosys') return 520;
  if (site === 'MUFG') {
    // MUFG: Sedan only enforced by caller; slabs by distance
    const d = Number(distanceKm || 0);
    if (d <= 20) return 550;
    if (d <= 30) return 650;
    if (d <= 40) return 750;
    return 750 + Math.ceil((d - 40) / 10) * 100; // beyond 40, add ₹100 per 10km slab
  }
  return 0;
}

router.get('/', requireAuth, (req, res) => {
  if (req.user.role === 'admin') {
    db.all('SELECT * FROM trips ORDER BY timestamp DESC', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
    return;
  }

  if (req.user.role === 'driver') {
    db.all('SELECT * FROM trips WHERE driver_id = ? ORDER BY timestamp DESC', [req.user.driver_id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
    return;
  }

  res.status(403).json({ error: 'Forbidden' });
});

router.post('/', requireAuth, (req, res) => {
  const {
    vehicle_id,
    driver_id,
    site,
    trip_type,
    distance_km,
    toll,
    remarks,
    timestamp,
  } = req.body;

  const time = timestamp || new Date().toISOString();

  // Fetch vehicle to enforce MUFG sedan rule
  db.get('SELECT * FROM vehicles WHERE id = ?', [vehicle_id], (err, vehicle) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!vehicle) return res.status(400).json({ error: 'Vehicle not found' });

    if (site === 'MUFG' && vehicle.type !== 'Sedan') {
      return res.status(400).json({ error: 'MUFG trips allowed for Sedan only' });
    }

    // validate MUFG distance
    if (site === 'MUFG' && (distance_km === undefined || distance_km === null || isNaN(Number(distance_km)))) {
      return res.status(400).json({ error: 'Distance (km) is required for MUFG trips' });
    }

    // basic validation
    if (!driver_id) return res.status(400).json({ error: 'driver_id required' });

    if (req.user.role === 'driver' && String(req.user.driver_id) !== String(driver_id)) {
      return res.status(403).json({ error: 'Drivers can only log trips for themselves' });
    }

    const fare = calculateFare(site, vehicle.type, distance_km);

    db.run(
      'INSERT INTO trips (timestamp, vehicle_id, driver_id, site, trip_type, distance_km, fare, toll, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [time, vehicle_id, driver_id, site, trip_type, distance_km, fare, toll || 0, remarks],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, fare });
      }
    );
  });
});

router.delete('/:id', requireAuth, (req, res) => {
  const tripId = req.params.id;
  db.get('SELECT * FROM trips WHERE id = ?', [tripId], (err, trip) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (req.user.role === 'driver' && String(req.user.driver_id) !== String(trip.driver_id)) {
      return res.status(403).json({ error: 'Drivers can only delete their own trips' });
    }
    if (req.user.role !== 'admin' && req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    db.run('DELETE FROM trips WHERE id = ?', [tripId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    });
  });
});

module.exports = router;
