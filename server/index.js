const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { db, init } = require('./db');
const path = require('path');
const { authMiddleware } = require('./auth');

const ownersRouter = require('./routes/owners');
const driversRouter = require('./routes/drivers');
const vehiclesRouter = require('./routes/vehicles');
const tripsRouter = require('./routes/trips');
const fuelRouter = require('./routes/fuel');
const reportsRouter = require('./routes/reports');
const authRouter = require('./routes/auth');
const adminsRouter = require('./routes/admins');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(authMiddleware);

init();

app.use('/api/auth', authRouter);
app.use('/api/owners', ownersRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/fuel', fuelRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admins', adminsRouter);

app.get('/', (req, res) => {
  res.send({ status: 'Cab Expense Tracker API' });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  next(err);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
