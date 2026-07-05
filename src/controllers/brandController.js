const db = require('../config/db');
const crypto = require('crypto');

// Get all brands
exports.getAllBrands = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM brands');
    res.json(rows);
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
