const db = require('../config/db');
const crypto = require('crypto');

// Get all brands
exports.getAllBrands = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM brands LIMIT 15');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get brand by ID
exports.getBrandById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM brands WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Brand not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Create brand
exports.createBrand = async (req, res) => {
  const { name, logo_url } = req.body;
  try {
    const id = crypto.randomUUID();
    await db.query('INSERT INTO brands (id, name, logo_url) VALUES (?, ?, ?)', [id, name, logo_url]);
    res.status(201).json({ id, message: 'Brand created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
