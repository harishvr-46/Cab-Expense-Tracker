const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, requireRole } = require('../auth');

router.get('/', requireAuth, (req, res) => {
  if (req.user.role === 'admin') {
    db.all('SELECT * FROM vehicles', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
    return;
  }

  if (req.user.role === 'driver') {
    db.all('SELECT * FROM vehicles WHERE driver_id = ?', [req.user.driver_id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
    return;
  }

  res.status(403).json({ error: 'Forbidden' });
});

router.get('/:id', requireAuth, (req, res) => {
  db.get('SELECT * FROM vehicles WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Vehicle not found' });
    if (req.user.role === 'driver' && String(row.driver_id) !== String(req.user.driver_id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(row);
  });
});

router.post('/', requireRole('admin'), (req, res) => {
  const {
    reg_no,
    type,
    fuel_type,
    owner_id,
    driver_id,
    vehicle_picture,
    rc_document,
    insurance_document,
    permit_document,
    child_lock_certificate,
    fire_extinguisher_present,
    umbrella_present,
    torch_light_present,
    first_aid_box_present,
    other_equipment
  } = req.body;

  if (!reg_no || String(reg_no).trim() === '') return res.status(400).json({ error: 'reg_no is required' });

  // validate vehicle_picture size when provided (max 1MB)
  if (vehicle_picture && typeof vehicle_picture === 'string'){
    const parts = vehicle_picture.split(',')
    const data = parts[1] || parts[0]
    const sizeInBytes = Math.ceil(data.length * 3 / 4)
    if (sizeInBytes > 1024 * 1024) return res.status(400).json({ error: 'vehicle_picture too large (max 1MB)' })
    if (!vehicle_picture.startsWith('data:image/')) return res.status(400).json({ error: 'vehicle_picture must be a data URL of an image' })
  }

  // helper to validate doc fields (image or pdf, max 2MB)
  function validateDocField(fieldValue){
    if(!fieldValue || typeof fieldValue !== 'string') return null
    const parts = fieldValue.split(',')
    const data = parts[1] || parts[0]
    const sizeInBytes = Math.ceil(data.length * 3 / 4)
    if (sizeInBytes > 2 * 1024 * 1024) return 'file too large (max 2MB)'
    if (!(fieldValue.startsWith('data:image/') || fieldValue.startsWith('data:application/pdf'))) return 'must be image or PDF data URL'
    return null
  }

  const rcErr = validateDocField(rc_document)
  if(rcErr) return res.status(400).json({ error: 'rc_document: '+rcErr })
  const insErr = validateDocField(insurance_document)
  if(insErr) return res.status(400).json({ error: 'insurance_document: '+insErr })
  const perErr = validateDocField(permit_document)
  if(perErr) return res.status(400).json({ error: 'permit_document: '+perErr })
  const clErr = validateDocField(child_lock_certificate)
  if(clErr) return res.status(400).json({ error: 'child_lock_certificate: '+clErr })

  db.run(
    'INSERT INTO vehicles (reg_no, type, fuel_type, owner_id, driver_id, vehicle_picture, rc_document, insurance_document, permit_document, child_lock_certificate, fire_extinguisher_present, umbrella_present, torch_light_present, first_aid_box_present, other_equipment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [reg_no, type, fuel_type, owner_id || null, driver_id || null, vehicle_picture || null, rc_document || null, insurance_document || null, permit_document || null, child_lock_certificate || null, fire_extinguisher_present ? 1 : 0, umbrella_present ? 1 : 0, torch_light_present ? 1 : 0, first_aid_box_present ? 1 : 0, other_equipment || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

router.put('/:id', requireRole('admin'), (req, res) => {
  const id = req.params.id;
  const {
    reg_no,
    type,
    fuel_type,
    owner_id,
    driver_id,
    vehicle_picture,
    rc_document,
    insurance_document,
    permit_document,
    child_lock_certificate,
    fire_extinguisher_present,
    umbrella_present,
    torch_light_present,
    first_aid_box_present,
    other_equipment
  } = req.body;

  if (!reg_no || String(reg_no).trim() === '') return res.status(400).json({ error: 'reg_no is required' });

  if (vehicle_picture && typeof vehicle_picture === 'string'){
    const parts = vehicle_picture.split(',')
    const data = parts[1] || parts[0]
    const sizeInBytes = Math.ceil(data.length * 3 / 4)
    if (sizeInBytes > 1024 * 1024) return res.status(400).json({ error: 'vehicle_picture too large (max 1MB)' })
    if (!vehicle_picture.startsWith('data:image/')) return res.status(400).json({ error: 'vehicle_picture must be a data URL of an image' })
  }

  // validate doc fields for PUT as well (image or pdf, max 2MB)
  function validateDocField(fieldValue){
    if(!fieldValue || typeof fieldValue !== 'string') return null
    const parts = fieldValue.split(',')
    const data = parts[1] || parts[0]
    const sizeInBytes = Math.ceil(data.length * 3 / 4)
    if (sizeInBytes > 2 * 1024 * 1024) return 'file too large (max 2MB)'
    if (!(fieldValue.startsWith('data:image/') || fieldValue.startsWith('data:application/pdf'))) return 'must be image or PDF data URL'
    return null
  }

  const rcErr = validateDocField(rc_document)
  if(rcErr) return res.status(400).json({ error: 'rc_document: '+rcErr })
  const insErr = validateDocField(insurance_document)
  if(insErr) return res.status(400).json({ error: 'insurance_document: '+insErr })
  const perErr = validateDocField(permit_document)
  if(perErr) return res.status(400).json({ error: 'permit_document: '+perErr })
  const clErr = validateDocField(child_lock_certificate)
  if(clErr) return res.status(400).json({ error: 'child_lock_certificate: '+clErr })

  db.run(
    `UPDATE vehicles SET reg_no = ?, type = ?, fuel_type = ?, owner_id = ?, driver_id = ?, vehicle_picture = ?, rc_document = ?, insurance_document = ?, permit_document = ?, child_lock_certificate = ?, fire_extinguisher_present = ?, umbrella_present = ?, torch_light_present = ?, first_aid_box_present = ?, other_equipment = ? WHERE id = ?`,
    [reg_no, type, fuel_type, owner_id || null, driver_id || null, vehicle_picture || null, rc_document || null, insurance_document || null, permit_document || null, child_lock_certificate || null, fire_extinguisher_present ? 1 : 0, umbrella_present ? 1 : 0, torch_light_present ? 1 : 0, first_aid_box_present ? 1 : 0, other_equipment || null, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    }
  );
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.run('DELETE FROM vehicles WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
