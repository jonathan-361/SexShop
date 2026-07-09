const db = require('../config/db');
const crypto = require('crypto');

/**
 * POST /api/orders
 * Crea un pedido desde el carrito del usuario autenticado.
 * customer_id viene del JWT. Sin store_id ni commission_amount.
 * Body: { address_id, shipping_amount, items: [{product_id, product_name, unit_price, quantity}] }
 */
exports.createOrder = async (req, res) => {
  const { address_id, shipping_amount = 0, tax_amount = 0, discount_amount = 0, notes, items } = req.body;
  const customerId = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'El pedido debe incluir al menos un ítem.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const total = subtotal + Number(shipping_amount) + Number(tax_amount) - Number(discount_amount);

    const orderId = crypto.randomUUID();
    await conn.query(
      `INSERT INTO orders
        (id, customer_id, address_id, subtotal_amount, shipping_amount, tax_amount, discount_amount, total_amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, customerId, address_id || null, subtotal, shipping_amount, tax_amount, discount_amount, total, notes || null]
    );

    for (const item of items) {
      const itemId = crypto.randomUUID();
      await conn.query(
        'INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [itemId, orderId, item.product_id, item.product_name, item.unit_price, item.quantity, item.unit_price * item.quantity]
      );
    }

    await conn.commit();
    res.status(201).json({ id: orderId, total, message: 'Pedido creado correctamente.' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
};

// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, u.names, u.first_lastname, u.email
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 15
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get order by ID (con ítems)
exports.getOrderById = async (req, res) => {
  try {
    const [order] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (order.length === 0) return res.status(404).json({ message: 'Pedido no encontrado.' });

    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ ...order[0], items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get orders for the authenticated user
exports.getMyOrders = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  const { order_status, notes } = req.body;
  try {
    await db.query(
      'UPDATE orders SET order_status = ?, notes = ? WHERE id = ?',
      [order_status, notes || null, req.params.id]
    );
    res.json({ message: 'Estado del pedido actualizado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete order (admin)
exports.deleteOrder = async (req, res) => {
  try {
    await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Pedido eliminado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
