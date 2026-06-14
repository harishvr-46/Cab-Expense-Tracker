# Cab Expense Tracker

Minimal fullstack scaffold for the Cab Expense Tracker app.

Server (Express + SQLite): c:\Users\haris\OneDrive\Desktop\Cab Expense Tracker\server

Client (React + Vite): c:\Users\haris\OneDrive\Desktop\Cab Expense Tracker\client

Quick start

1. Install server deps

```powershell
cd server
npm install
npm start
```

2. Install client deps and run

```powershell
cd client
npm install
npm run dev
```

API endpoints (basic)

- `GET /api/vehicles` - list vehicles
- `POST /api/vehicles` - add vehicle
- `GET /api/drivers` - list drivers
- `POST /api/drivers` - add driver
- `POST /api/trips` - log trip (calculates fare)
- `POST /api/fuel` - log fuel entry
- `GET /api/reports/monthly?vehicle_id=1&month=2026-06` - monthly report

Notes

- Database: SQLite file `data.db` created at project root.
- Migrations: `server/migrations/init.sql` runs on server start.
- Fare logic: Infosys flat ₹520; MUFG slabbed for Sedans as specified.
