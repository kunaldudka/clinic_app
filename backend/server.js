require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Health check (available before DB ready)
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Boot: init DB then mount routes
initDb().then(() => {
  const authRoutes = require('./routes/auth');
  const patientRoutes = require('./routes/patients');
  const visitRoutes = require('./routes/visits');
  const prescriptionRoutes = require('./routes/prescriptions');
  const dashboardRoutes = require('./routes/dashboard');
  const medicineRoutes = require('./routes/medicines');

  app.use('/api/auth', authRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/patients/:patientId/visits', visitRoutes);
  app.use('/api/visits', visitRoutes);
  app.use('/api/visits/:visitId/prescriptions', prescriptionRoutes);
  app.use('/api/prescriptions', prescriptionRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/medicines', medicineRoutes);

  // 404 handler
  app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`Chavan's Child Clinic API running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
