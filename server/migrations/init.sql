PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS owners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT
);

CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  licence TEXT,
  monthly_salary REAL DEFAULT 0
  ,profile_picture TEXT
  ,aadhaar TEXT
  ,pan TEXT
  ,pvc_status TEXT
  ,address TEXT
  ,contact_number TEXT
  ,family_contact_number TEXT
  ,emergency_contact TEXT
  ,notes TEXT
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reg_no TEXT NOT NULL UNIQUE,
  type TEXT,
  fuel_type TEXT,
  owner_id INTEGER,
  driver_id INTEGER,
  rc_document TEXT,
  insurance_document TEXT,
  permit_document TEXT,
  child_lock_certificate TEXT,
  fire_extinguisher_present INTEGER DEFAULT 0,
  umbrella_present INTEGER DEFAULT 0,
  torch_light_present INTEGER DEFAULT 0,
  first_aid_box_present INTEGER DEFAULT 0,
  other_equipment TEXT,
  vehicle_picture TEXT,
  FOREIGN KEY(owner_id) REFERENCES owners(id),
  FOREIGN KEY(driver_id) REFERENCES drivers(id)
);

CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  vehicle_id INTEGER NOT NULL,
  driver_id INTEGER NOT NULL,
  site TEXT NOT NULL,
  trip_type TEXT,
  distance_km REAL,
  fare REAL,
  toll REAL DEFAULT 0,
  remarks TEXT,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY(driver_id) REFERENCES drivers(id)
);

CREATE TABLE IF NOT EXISTS fuel_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  vehicle_id INTEGER NOT NULL,
  fuel_type TEXT NOT NULL,
  litres REAL,
  amount REAL,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS salary_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month TEXT NOT NULL,
  driver_id INTEGER NOT NULL,
  amount REAL,
  paid_on TEXT,
  FOREIGN KEY(driver_id) REFERENCES drivers(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  admin_level TEXT,
  created_by INTEGER,
  driver_id INTEGER,
  FOREIGN KEY(driver_id) REFERENCES drivers(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
);

-- Ensure new columns exist for existing databases (SQLite will error if they already exist)
ALTER TABLE drivers ADD COLUMN profile_picture TEXT;
ALTER TABLE drivers ADD COLUMN aadhaar TEXT;
ALTER TABLE drivers ADD COLUMN pan TEXT;
ALTER TABLE drivers ADD COLUMN pvc_status TEXT;
ALTER TABLE drivers ADD COLUMN address TEXT;
ALTER TABLE drivers ADD COLUMN contact_number TEXT;
ALTER TABLE drivers ADD COLUMN family_contact_number TEXT;
ALTER TABLE drivers ADD COLUMN emergency_contact TEXT;
ALTER TABLE drivers ADD COLUMN notes TEXT;

ALTER TABLE vehicles ADD COLUMN rc_document TEXT;
ALTER TABLE vehicles ADD COLUMN insurance_document TEXT;
ALTER TABLE vehicles ADD COLUMN permit_document TEXT;
ALTER TABLE vehicles ADD COLUMN child_lock_certificate TEXT;
ALTER TABLE vehicles ADD COLUMN fire_extinguisher_present INTEGER DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN umbrella_present INTEGER DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN torch_light_present INTEGER DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN first_aid_box_present INTEGER DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN other_equipment TEXT;
ALTER TABLE vehicles ADD COLUMN vehicle_picture TEXT;

ALTER TABLE users ADD COLUMN admin_level TEXT;
ALTER TABLE users ADD COLUMN created_by INTEGER;
