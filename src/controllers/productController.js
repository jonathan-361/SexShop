const db = require('../config/db');
const crypto = require('crypto');

// Get all products (con imágenes resumidas)
exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.category_id, p.brand_id, p.name, p.description,
             p.price, p.discount_price, p.stock, p.status, p.created_at,
             b.name AS brand_name, c.name AS category_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LIMIT 15
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get product by ID (con imágenes)
exports.getProductById = async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, b.name AS brand_name, c.name AS category_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [req.params.id]);
    if (products.length === 0) return res.status(404).json({ message: 'Producto no encontrado.' });

    const [images] = await db.query(
      'SELECT id, url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order',
      [req.params.id]
    );

    res.json({ ...products[0], images });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create product (sin store_id)
exports.createProduct = async (req, res) => {
  const { category_id, brand_id, name, description, price, discount_price, stock } = req.body;
  if (!name || !price) {
    return res.status(400).json({ message: 'name y price son obligatorios.' });
  }
  try {
    const id = crypto.randomUUID();
    await db.query(
      'INSERT INTO products (id, category_id, brand_id, name, description, price, discount_price, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, category_id || null, brand_id || null, name, description || null, price, discount_price || null, stock || 0]
    );
    res.status(201).json({ id, message: 'Producto creado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  const { category_id, brand_id, name, description, price, discount_price, stock, status } = req.body;
  try {
    await db.query(
      'UPDATE products SET category_id = ?, brand_id = ?, name = ?, description = ?, price = ?, discount_price = ?, stock = ?, status = ? WHERE id = ?',
      [category_id || null, brand_id || null, name, description || null, price, discount_price || null, stock, status || 'active', req.params.id]
    );
    res.json({ message: 'Producto actualizado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Producto eliminado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
