require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');

// Auto seed check on server boot
const seed = require('./database/seed');
seed();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static directories
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/enquiries'));
app.use('/api', require('./routes/products'));
app.use('/api', require('./routes/projects'));
app.use('/api', require('./routes/settings'));
app.use('/api', require('./routes/upload'));
app.use('/api', require('./routes/stats'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Admin panel route
app.get(/^\/admin(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Clean URLs for front-end pages
const pages = ['index', 'about', 'products', 'projects', 'why-us', 'contact'];

pages.forEach((page) => {
  const file = `${page}.html`;
  // Handle both /page and /page.html
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, file));
  });
  app.get(`/${file}`, (req, res) => {
    res.sendFile(path.join(__dirname, file));
  });
});

// Root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all 404 for API
app.all(/^\/api(\/.*)?$/, (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Fallback for unknown routes: redirect to home or 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Standard Forms & Tubes Server running!`);
  console.log(`🌐 Website URL:  http://localhost:${PORT}`);
  console.log(`🔐 Admin Portal: http://localhost:${PORT}/admin`);
  console.log(`📡 API Health:   http://localhost:${PORT}/api/health`);
  console.log('====================================================');
});
