const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

// Public: GET /api/settings
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json({ settings });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Admin: PUT /api/admin/settings
router.put('/admin/settings', authMiddleware, (req, res) => {
  try {
    const entries = req.body; // e.g. { phone_primary: '+91...', email: '...' }
    if (!entries || typeof entries !== 'object') {
      return res.status(400).json({ error: 'Settings payload must be a key-value object' });
    }

    const upsert = db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    const updateMany = db.transaction((obj) => {
      for (const [k, v] of Object.entries(obj)) {
        upsert.run(k, String(v));
      }
    });

    updateMany(entries);

    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;

    res.json({ success: true, settings });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
