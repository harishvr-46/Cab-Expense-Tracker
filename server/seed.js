const { db, init } = require('./db');
const http = require('http');
const crypto = require('crypto');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function run(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err){
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });
}

function get(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row)=> {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function seed() {
  init();
  const seed = require('./seed');

init();

seed().catch(err => {
  console.error('Seed failed:', err);
});

  try {
    // ensure owner
    const ownerEmail = 'owner@example.com';
    let row = await get('SELECT id FROM owners WHERE email = ?', [ownerEmail]);
    let ownerId;
    if (row) ownerId = row.id;
    else ownerId = await run('INSERT INTO owners (name, phone, email) VALUES (?, ?, ?)', ['Acme Owner', '9999999999', ownerEmail]);

    // ensure driver
    const licence = 'DL-12345';
    row = await get('SELECT id FROM drivers WHERE licence = ?', [licence]);
    let driverId;
    if (row) driverId = row.id;
    else driverId = await run('INSERT INTO drivers (name, licence, monthly_salary) VALUES (?, ?, ?)', ['Ramesh', licence, 25000]);

    const licence2 = 'DL-54321';
    row = await get('SELECT id FROM drivers WHERE licence = ?', [licence2]);
    let driver2Id;
    if (row) driver2Id = row.id;
    else driver2Id = await run('INSERT INTO drivers (name, licence, monthly_salary) VALUES (?, ?, ?)', ['Suresh', licence2, 26000]);

    // ensure users
    const adminHash = crypto.createHash('sha256').update('admin123').digest('hex');
    row = await get('SELECT id FROM users WHERE username = ?', ['admin']);
    if (!row) await run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', adminHash, 'admin']);

    const superAdminHash = crypto.createHash('sha256').update('superadmin123').digest('hex');
    row = await get('SELECT id FROM users WHERE username = ?', ['superadmin']);
    if (!row) await run('INSERT INTO users (username, password_hash, role, admin_level) VALUES (?, ?, ?, ?)', ['superadmin', superAdminHash, 'admin', 'super']);

    const driverHash = crypto.createHash('sha256').update('driver123').digest('hex');
    row = await get('SELECT id FROM users WHERE username = ?', ['driver1']);
    if (!row) await run('INSERT INTO users (username, password_hash, role, driver_id) VALUES (?, ?, ?, ?)', ['driver1', driverHash, 'driver', driverId]);

    const driver2Hash = crypto.createHash('sha256').update('driver456').digest('hex');
    row = await get('SELECT id FROM users WHERE username = ?', ['driver2']);
    if (!row) await run('INSERT INTO users (username, password_hash, role, driver_id) VALUES (?, ?, ?, ?)', ['driver2', driver2Hash, 'driver', driver2Id]);

    // ensure vehicle
    const reg = 'MH12AB1234';
    row = await get('SELECT id FROM vehicles WHERE reg_no = ?', [reg]);
    let vehicleId;
    if (row) vehicleId = row.id;
    else vehicleId = await run('INSERT INTO vehicles (reg_no, type, fuel_type, owner_id, driver_id) VALUES (?, ?, ?, ?, ?)', [reg, 'Sedan', 'CNG', ownerId, driverId]);

    // Trips for June 2026
    await run('INSERT INTO trips (timestamp, vehicle_id, driver_id, site, trip_type, distance_km, fare, toll, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['2026-06-03T09:00:00.000Z', vehicleId, driverId, 'Infosys', 'Pickup', null, 520, 20, 'Morning']);
    await run('INSERT INTO trips (timestamp, vehicle_id, driver_id, site, trip_type, distance_km, fare, toll, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['2026-06-05T18:00:00.000Z', vehicleId, driverId, 'MUFG', 'Drop', 25, 650, 30, 'Evening']);
    await run('INSERT INTO trips (timestamp, vehicle_id, driver_id, site, trip_type, distance_km, fare, toll, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['2026-06-10T12:00:00.000Z', vehicleId, driverId, 'MUFG', 'Pickup', 35, 750, 0, 'No toll']);
    await run('INSERT INTO trips (timestamp, vehicle_id, driver_id, site, trip_type, distance_km, fare, toll, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['2026-06-15T08:30:00.000Z', vehicleId, driverId, 'Infosys', 'Drop', null, 520, 10, 'Short']);

    // Fuel logs
    await run('INSERT INTO fuel_logs (date, vehicle_id, fuel_type, litres, amount) VALUES (?, ?, ?, ?, ?)', ['2026-06-04', vehicleId, 'CNG', 10, 400]);
    await run('INSERT INTO fuel_logs (date, vehicle_id, fuel_type, litres, amount) VALUES (?, ?, ?, ?, ?)', ['2026-06-20', vehicleId, 'CNG', 12, 480]);

    console.log('Seed data inserted. Vehicle ID:', vehicleId);

    // Fetch monthly report
    const month = '2026-06';
    const data = await fetchJson(`http://localhost:4000/api/reports/monthly?vehicle_id=${vehicleId}&month=${month}`);
    console.log('Monthly report:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    db.close();
  }
}

seed();
