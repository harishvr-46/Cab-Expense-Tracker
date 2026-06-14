const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../auth');

// Monthly report per vehicle: ?vehicle_id=1&month=2026-06
router.get('/monthly', requireAuth, (req, res) => {
  const { vehicle_id, month } = req.query;
  if (!vehicle_id || !month) return res.status(400).json({ error: 'vehicle_id and month required' });

  const monthStart = month + '-01';
  const monthEnd = month + '-31';

  const report = {};

  db.get('SELECT * FROM vehicles WHERE id = ?', [vehicle_id], (err, vehicle) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (req.user.role === 'driver' && String(vehicle.driver_id) !== String(req.user.driver_id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    report.vehicle = vehicle;

    // Trip income per site
    db.all(
      `SELECT site, COUNT(*) as trips, SUM(fare) as total_fare FROM trips WHERE vehicle_id = ? AND timestamp BETWEEN ? AND ? GROUP BY site`,
      [vehicle_id, monthStart, monthEnd],
      (err, tripsRows) => {
        if (err) return res.status(500).json({ error: err.message });
        report.trip_income = tripsRows;

        // Fuel expenses split by fuel_type
        db.all(
          `SELECT fuel_type, SUM(amount) as total_amount FROM fuel_logs WHERE vehicle_id = ? AND date BETWEEN ? AND ? GROUP BY fuel_type`,
          [vehicle_id, monthStart, monthEnd],
          (err, fuelRows) => {
            if (err) return res.status(500).json({ error: err.message });
            report.fuel = fuelRows;

            // Toll sum
            db.get(
              `SELECT SUM(toll) as total_tolls FROM trips WHERE vehicle_id = ? AND timestamp BETWEEN ? AND ?`,
              [vehicle_id, monthStart, monthEnd],
              (err, tollRow) => {
                if (err) return res.status(500).json({ error: err.message });
                report.tolls = tollRow.total_tolls || 0;

                // Driver salary (driver assigned to vehicle)
                const driverId = vehicle.driver_id;
                if (!driverId) {
                  report.driver_salary = 0;
                  finalize();
                } else {
                  db.get('SELECT monthly_salary FROM drivers WHERE id = ?', [driverId], (err, drow) => {
                    if (err) return res.status(500).json({ error: err.message });
                    report.driver_salary = drow ? drow.monthly_salary || 0 : 0;
                    finalize();
                  });
                }

                function finalize() {
                  // compute totals
                  const totalFare = (report.trip_income || []).reduce((s, r) => s + (r.total_fare || 0), 0);
                  const totalFuel = (report.fuel || []).reduce((s, r) => s + (r.total_amount || 0), 0);
                  const totalTolls = report.tolls || 0;
                  const driverSalary = report.driver_salary || 0;
                  report.summary = {
                    total_fare: totalFare,
                    total_fuel: totalFuel,
                    total_tolls: totalTolls,
                    driver_salary: driverSalary,
                    net: totalFare - (totalFuel + totalTolls + driverSalary),
                  };
                  res.json(report);
                }
              }
            );
          }
        );
      }
    );
  });
});

module.exports = router;
