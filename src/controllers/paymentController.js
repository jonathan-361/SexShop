const db = require('../config/db');
const crypto = require('crypto');

// Create payment
exports.createPayment = async (req, res) => {
  const { order_id, payment_method, transaction_id, amount } = req.body;
  try {
    const id = crypto.randomUUID();
    await db.query(
      'INSERT INTO payments (id, order_id, payment_method, transaction_id, amount) VALUES (?, ?, ?, ?, ?)',
      [id, order_id, payment_method, transaction_id, amount]
    );
    res.status(201).json({ id, message: 'Payment recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get payment by order ID
exports.getPaymentByOrderId = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM payments WHERE order_id = ?', [req.params.orderId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Payment not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
