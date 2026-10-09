const express = require('express');
const cors = require('cors');

// Route imports
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const consultationRoutes = require('./routes/consultationRoutes');

// Middleware imports
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// CORS configuration
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching frontend origins
      if (!origin || origin === allowedOrigin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev to avoid friction
    },
    credentials: true
  })
);

// Express JSON body parser
app.use(express.json());

// API Root Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OPD Mini-Module API is healthy and running'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consultations', consultationRoutes);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Central Error Handler
app.use(errorHandler);

module.exports = app;
