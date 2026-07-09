const db = require('../config/db');

/**
 * GET /api/cart
 * Obtiene el carrito del usuario autenticado (sin store_id).
 * El user_id se extrae del token JWT (req.user.id).
 */
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const [cart] = await db.query('SELECT * FROM shopping_cart WHERE user_id = ?', [userId]);
    if (cart.length === 0) return res.json({ items: [] });

    const [items] = await db.query(
      `SELECT sci.product_id, p.name AS product_name, sci.quantity, sci.unit_price,
              (sci.quantity * sci.unit_price) AS subtotal
       FROM shopping_cart_items sci
       LEFT JOIN products p ON sci.product_id = p.id
       WHERE sci.cart_id = ?`,
      [cart[0].id]
    );

    res.json({ cart_id: cart[0].id, created_at: cart[0].created_at, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/cart
 * Agrega o actualiza un ítem en el carrito del usuario autenticado.
 * Body: { product_id, quantity, unit_price }
 * Ya no requiere store_id.
 */
exports.addItemToCart = async (req, res) => {
  const { product_id, quantity, unit_price } = req.body;
  const userId = req.user.id;

  if (!product_id || !quantity || !unit_price) {
    return res.status(400).json({ message: 'product_id, quantity y unit_price son obligatorios.' });
  }
  if (quantity <= 0) {
    return res.status(400).json({ message: 'La cantidad debe ser mayor a 0.' });
  }

  try {
    // 1. Buscar o crear el carrito del usuario
    let [cart] = await db.query('SELECT id FROM shopping_cart WHERE user_id = ?', [userId]);
    let cartId;

    if (cart.length === 0) {
      const crypto = require('crypto');
      cartId = crypto.randomUUID();
      await db.query('INSERT INTO shopping_cart (id, user_id) VALUES (?, ?)', [cartId, userId]);
    } else {
      cartId = cart[0].id;
    }

    // 2. Verificar que el producto exista
    const [product] = await db.query('SELECT id FROM products WHERE id = ?', [product_id]);
    if (product.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    // 3. Agregar o sumar cantidad si ya existe
    await db.query(
      `INSERT INTO shopping_cart_items (cart_id, product_id, quantity, unit_price)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [cartId, product_id, quantity, unit_price]
    );

    res.status(201).json({ message: 'Ítem agregado al carrito.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/cart/:product_id
 * Actualiza la cantidad de un ítem en el carrito del usuario autenticado.
 * Body: { quantity }
 */
exports.updateCartItem = async (req, res) => {
  const { product_id } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: 'La cantidad debe ser mayor a 0.' });
  }

  try {
    const [cart] = await db.query('SELECT id FROM shopping_cart WHERE user_id = ?', [userId]);
    if (cart.length === 0) return res.status(404).json({ message: 'Carrito no encontrado.' });

    const [result] = await db.query(
      'UPDATE shopping_cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?',
      [quantity, cart[0].id, product_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ítem no encontrado en el carrito.' });
    }

    res.json({ message: 'Cantidad actualizada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/cart/:product_id
 * Elimina un ítem del carrito del usuario autenticado.
 */
exports.removeCartItem = async (req, res) => {
  const { product_id } = req.params;
  const userId = req.user.id;

  try {
    const [cart] = await db.query('SELECT id FROM shopping_cart WHERE user_id = ?', [userId]);
    if (cart.length === 0) return res.status(404).json({ message: 'Carrito no encontrado.' });

    const [result] = await db.query(
      'DELETE FROM shopping_cart_items WHERE cart_id = ? AND product_id = ?',
      [cart[0].id, product_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ítem no encontrado en el carrito.' });
    }

    res.json({ message: 'Ítem eliminado del carrito.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
