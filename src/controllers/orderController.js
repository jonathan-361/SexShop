const db = require('../config/db');
const crypto = require('crypto');

// Create order from cart
exports.createOrder = async (req, res) => {
  const { customer_id, store_id, address_id, subtotal_amount, shipping_amount, total_amount, items } = req.body;
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // 1. Create Order
    const orderId = crypto.randomUUID();
    await connection.query(
      'INSERT INTO orders (id, customer_id, store_id, address_id, subtotal_amount, shipping_amount, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [orderId, customer_id, store_id, address_id, subtotal_amount, shipping_amount, total_amount]
    );
    
    // 2. Add Items
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.product_name, item.unit_price, item.quantity, item.unit_price * item.quantity]
      );
    }
    
    await connection.commit();
    res.status(201).json({ id: orderId, message: 'Order created successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const [order] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (order.length === 0) return res.status(404).json({ message: 'Order not found' });
    
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ ...order[0], items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
