const db = require('../config/db');

// Get all stores
exports.getAllStores = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM stores');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get store by ID
exports.getStoreById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM stores WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Store not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create store
exports.createStore = async (req, res) => {
  const { owner_id, store_name, store_description, logo_url, banner_url, email, phone, commission_rate } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO stores (owner_id, store_name, store_description, logo_url, banner_url, email, phone, commission_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [owner_id, store_name, store_description, logo_url, banner_url, email, phone, commission_rate || 10.00]
    );
    res.status(211).json({ id: result.insertId, message: 'Store created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update store
exports.updateStore = async (req, res) => {
  const { store_name, store_description, logo_url, banner_url, email, phone, commission_rate, status } = req.body;
  try {
    await db.query(
      'UPDATE stores SET store_name = ?, store_description = ?, logo_url = ?, banner_url = ?, email = ?, phone = ?, commission_rate = ?, status = ? WHERE id = ?',
      [store_name, store_description, logo_url, banner_url, email, phone, commission_rate, status, req.params.id]
    );
    res.json({ message: 'Store updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete store
exports.deleteStore = async (req, res) => {
  try {
    await db.query('DELETE FROM stores WHERE id = ?', [req.params.id]);
    res.json({ message: 'Store deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
