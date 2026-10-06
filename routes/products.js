const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

// Public: GET /api/products
router.get('/products', (req, res) => {
  try {
    const { category, search } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category_id = ?';
      params.push(category);
    }

    if (search && search.trim()) {
      sql += ' AND (title LIKE ? OR tag LIKE ? OR description LIKE ?)';
      const q = `%${search.trim()}%`;
      params.push(q, q, q);
    }

    sql += ' ORDER BY id ASC';
    const products = db.prepare(sql).all(...params);
    res.json({ products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Public: GET /api/products/:id
router.get('/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ product });
});

// Admin: POST /api/admin/products - Create product
router.post('/admin/products', authMiddleware, (req, res) => {
  try {
    const { category_id, category_name, title, tag, description, image_url, specs, in_stock } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Product title is required' });
    }

    const insert = db.prepare(`
      INSERT INTO products (category_id, category_name, title, tag, description, image_url, specs, in_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      category_id || 'general',
      category_name || 'General',
      title.trim(),
      tag || null,
      description || null,
      image_url || 'assets/img/kflex-tubes-sheets.jpg',
      typeof specs === 'object' ? JSON.stringify(specs) : (specs || null),
      in_stock !== undefined ? (in_stock ? 1 : 0) : 1
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Admin: PUT /api/admin/products/:id - Update product
router.put('/admin/products/:id', authMiddleware, (req, res) => {
  try {
    const { category_id, category_name, title, tag, description, image_url, specs, in_stock } = req.body;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    db.prepare(`
      UPDATE products
      SET category_id = ?, category_name = ?, title = ?, tag = ?, description = ?, image_url = ?, specs = ?, in_stock = ?
      WHERE id = ?
    `).run(
      category_id !== undefined ? category_id : existing.category_id,
      category_name !== undefined ? category_name : existing.category_name,
      title !== undefined ? title : existing.title,
      tag !== undefined ? tag : existing.tag,
      description !== undefined ? description : existing.description,
      image_url !== undefined ? image_url : existing.image_url,
      typeof specs === 'object' ? JSON.stringify(specs) : (specs !== undefined ? specs : existing.specs),
      in_stock !== undefined ? (in_stock ? 1 : 0) : existing.in_stock,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ success: true, product: updated });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Admin: DELETE /api/admin/products/:id - Delete product
router.delete('/admin/products/:id', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
