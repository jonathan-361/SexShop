const db = require('../config/db');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  const { name, description, parent_category_id } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO categories (name, description, parent_category_id) VALUES (?, ?, ?)',
      [name, description, parent_category_id]
    );
    res.status(201).json({ id: result.insertId, message: 'Category created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ... More CRUD as needed ...
