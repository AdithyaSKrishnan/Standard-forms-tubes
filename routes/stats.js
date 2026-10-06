const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

// GET /api/admin/stats
router.get('/admin/stats', authMiddleware, (req, res) => {
  try {
    const totalEnquiries = db.prepare('SELECT COUNT(*) as count FROM enquiries').get().count;
    const newEnquiries = db.prepare("SELECT COUNT(*) as count FROM enquiries WHERE status = 'new'").get().count;
    const contactedEnquiries = db.prepare("SELECT COUNT(*) as count FROM enquiries WHERE status = 'contacted'").get().count;
    const quotedEnquiries = db.prepare("SELECT COUNT(*) as count FROM enquiries WHERE status = 'quoted'").get().count;
    const closedEnquiries = db.prepare("SELECT COUNT(*) as count FROM enquiries WHERE status = 'closed'").get().count;

    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const inStockProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE in_stock = 1').get().count;

    const totalProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;

    const recentEnquiries = db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 5').all();

    res.json({
      stats: {
        enquiries: {
          total: totalEnquiries,
          new: newEnquiries,
          contacted: contactedEnquiries,
          quoted: quotedEnquiries,
          closed: closedEnquiries
        },
        products: {
          total: totalProducts,
          inStock: inStockProducts
        },
        projects: {
          total: totalProjects
        }
      },
      recentEnquiries
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

module.exports = router;
