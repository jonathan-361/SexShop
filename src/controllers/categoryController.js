const db = require('../config/db');
const crypto = require('crypto');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories LIMIT 15');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Category not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Create category
exports.createCategory = async (req, res) => {
  const { name, description, parent_category_id } = req.body;
  try {
    const id = crypto.randomUUID();
    await db.query(
      'INSERT INTO categories (id, name, description, parent_category_id) VALUES (?, ?, ?, ?)',
      [id, name, description, parent_category_id]
    );
    res.status(201).json({ id, message: 'Category created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ... More CRUD as needed ...
