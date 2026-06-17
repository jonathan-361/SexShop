const db = require('../config/db');

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
    const [result] = await db.query('INSERT INTO brands (name, logo_url) VALUES (?, ?)', [name, logo_url]);
    res.status(201).json({ id: result.insertId, message: 'Brand created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
