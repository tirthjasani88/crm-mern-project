require('dotenv').config(); // Load .env file FIRST

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');

// ✅ FIXED: Correct file name (auth.js)
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const activityRoutes = require('./routes/activities');
const reportRoutes = require('./routes/reports');
const feedbackRoutes = require('./routes/feedback');
const taskRoutes = require('./routes/tasks');
const expenseRoutes = require('./routes/expenses');
const invoiceRoutes = require('./routes/invoices');

const app = express();

// ================= CORS Configuration =================
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// ================= Middleware =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= Session Configuration =================
app.use(session({
  secret: process.env.SESSION_SECRET || 'devsecret',
  resave: false,
  saveUninitialized: false,
  name: 'crm.session',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));


// ================= Health Check =================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CRM API is running',
    timestamp: new Date().toISOString()
  });
});

// ================= Routes =================
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', expenseRoutes);
app.use('/api', invoiceRoutes);

// ================= Global Error Handler =================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error'
  });
});

// ================= 404 Handler =================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;