const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');
const { sendEnquiryNotification } = require('../services/email');

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// POST /api/enquiries - Submit a new enquiry / quote request
router.post('/enquiries', async (req, res) => {
  try {
    const { name, phone, email, company, product, message, channel } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Please provide your name.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Please provide your phone number.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Please describe your requirement or query.' });
    }

    const insert = db.prepare(`
      INSERT INTO enquiries (name, phone, email, company, product, message, channel, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'new')
    `);

    const result = insert.run(
      name.trim(),
      phone.trim(),
      email ? email.trim() : null,
      company ? company.trim() : null,
      product ? product.trim() : 'General',
      message.trim(),
      channel === 'whatsapp' ? 'whatsapp' : 'web'
    );

    const enquiryId = result.lastInsertRowid;
    const enquiry = {
      id: enquiryId,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null,
      company: company ? company.trim() : null,
      product: product ? product.trim() : 'General',
      message: message.trim(),
      channel: channel === 'whatsapp' ? 'whatsapp' : 'web'
    };

    // Send asynchronous email notification (non-blocking)
    sendEnquiryNotification(enquiry).catch((err) => {
      console.error('Error in sendEnquiryNotification:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Enquiry received successfully! Our team will contact you shortly.',
      enquiryId
    });
  } catch (err) {
    console.error('Error saving enquiry:', err);
    res.status(500).json({ error: 'Failed to process enquiry. Please try again or call us directly.' });
  }
});

// ==========================================
// PROTECTED ADMIN ENDPOINTS
// ==========================================

// GET /api/admin/enquiries - List enquiries with filters and pagination
router.get('/admin/enquiries', authMiddleware, (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let baseSql = 'FROM enquiries WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      baseSql += ' AND status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      baseSql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ? OR product LIKE ? OR message LIKE ?)';
      params.push(q, q, q, q, q, q);
    }

    const countSql = `SELECT COUNT(*) as count ${baseSql}`;
    const total = db.prepare(countSql).get(...params).count;

    const dataSql = `SELECT * ${baseSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const enquiries = db.prepare(dataSql).all(...params, parseInt(limit, 10), offset);

    res.json({
      enquiries,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    });
  } catch (err) {
    console.error('Error fetching enquiries:', err);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

// GET /api/admin/enquiries/export - Export enquiries to CSV
router.get('/admin/enquiries/export', authMiddleware, (req, res) => {
  try {
    const enquiries = db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC').all();

    const headers = ['ID', 'Date', 'Name', 'Phone', 'Email', 'Company', 'Product', 'Message', 'Channel', 'Status', 'Notes'];
    const rows = enquiries.map((e) => [
      e.id,
      `"${new Date(e.created_at).toLocaleString()}"`,
      `"${(e.name || '').replace(/"/g, '""')}"`,
      `"${(e.phone || '').replace(/"/g, '""')}"`,
      `"${(e.email || '').replace(/"/g, '""')}"`,
      `"${(e.company || '').replace(/"/g, '""')}"`,
      `"${(e.product || '').replace(/"/g, '""')}"`,
      `"${(e.message || '').replace(/"/g, '""')}"`,
      `"${e.channel || 'web'}"`,
      `"${e.status || 'new'}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="standard_forms_enquiries_' + new Date().toISOString().slice(0, 10) + '.csv"');
    res.send(csvContent);
  } catch (err) {
    console.error('Error exporting enquiries:', err);
    res.status(500).json({ error: 'Failed to export enquiries' });
  }
});

// GET /api/admin/enquiries/:id - Single enquiry details
router.get('/admin/enquiries/:id', authMiddleware, (req, res) => {
  const enquiry = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(req.params.id);
  if (!enquiry) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }
  res.json({ enquiry });
});

// PATCH /api/admin/enquiries/:id - Update status or notes
router.patch('/admin/enquiries/:id', authMiddleware, (req, res) => {
  try {
    const { status, notes } = req.body;
    const enquiry = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    const newStatus = status !== undefined ? status : enquiry.status;
    const newNotes = notes !== undefined ? notes : enquiry.notes;

    db.prepare(`
      UPDATE enquiries
      SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, newNotes, req.params.id);

    const updated = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(req.params.id);
    res.json({ success: true, enquiry: updated });
  } catch (err) {
    console.error('Error updating enquiry:', err);
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
});

// DELETE /api/admin/enquiries/:id - Delete enquiry
router.delete('/admin/enquiries/:id', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM enquiries WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    res.json({ success: true, message: 'Enquiry deleted' });
  } catch (err) {
    console.error('Error deleting enquiry:', err);
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
});

module.exports = router;
