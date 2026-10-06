const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

// Public: GET /api/projects
router.get('/projects', (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY id DESC';
    const projects = db.prepare(sql).all(...params);
    res.json({ projects });
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Admin: POST /api/admin/projects
router.post('/admin/projects', authMiddleware, (req, res) => {
  try {
    const { title, category, description, image_url } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Project title is required' });
    }
    if (!image_url || !image_url.trim()) {
      return res.status(400).json({ error: 'Project image is required' });
    }

    const insert = db.prepare(`
      INSERT INTO projects (title, category, description, image_url)
      VALUES (?, ?, ?, ?)
    `);

    const result = insert.run(
      title.trim(),
      category || 'theatre',
      description ? description.trim() : null,
      image_url.trim()
    );

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, project });
  } catch (err) {
    console.error('Error adding project:', err);
    res.status(500).json({ error: 'Failed to add project' });
  }
});

// Admin: PUT /api/admin/projects/:id
router.put('/admin/projects/:id', authMiddleware, (req, res) => {
  try {
    const { title, category, description, image_url } = req.body;
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    db.prepare(`
      UPDATE projects
      SET title = ?, category = ?, description = ?, image_url = ?
      WHERE id = ?
    `).run(
      title !== undefined ? title : existing.title,
      category !== undefined ? category : existing.category,
      description !== undefined ? description : existing.description,
      image_url !== undefined ? image_url : existing.image_url,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json({ success: true, project: updated });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Admin: DELETE /api/admin/projects/:id
router.delete('/admin/projects/:id', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
