const db = require('../config/db');
const crypto = require('crypto');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products LIMIT 15');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get product with images
exports.getProductById = async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (products.length === 0) return res.status(404).json({ message: 'Product not found' });
    
    const [images] = await db.query('SELECT * FROM product_images WHERE product_id = ?', [req.params.id]);
    
    res.json({ ...products[0], images });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  const { store_id, category_id, brand_id, name, description, price, discount_price, stock } = req.body;
  try {
    const id = crypto.randomUUID();
    await db.query(
      'INSERT INTO products (id, store_id, category_id, brand_id, name, description, price, discount_price, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, store_id, category_id, brand_id, name, description, price, discount_price, stock || 0]
    );
    res.status(201).json({ id, message: 'Product created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
