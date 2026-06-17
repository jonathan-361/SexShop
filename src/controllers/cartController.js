const db = require('../config/db');

// Get cart for user and store
exports.getCart = async (req, res) => {
  const { user_id, store_id } = req.query;
  try {
    const [cart] = await db.query('SELECT * FROM shopping_cart WHERE user_id = ? AND store_id = ?', [user_id, store_id]);
    if (cart.length === 0) return res.json({ items: [] });
    
    const [items] = await db.query('SELECT * FROM shopping_cart_items WHERE cart_id = ?', [cart[0].id]);
    res.json({ ...cart[0], items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add item to cart
exports.addItemToCart = async (req, res) => {
  const { user_id, store_id, product_id, quantity, unit_price } = req.body;
  try {
    // 1. Ensure cart exists
    let [cart] = await db.query('SELECT id FROM shopping_cart WHERE user_id = ? AND store_id = ?', [user_id, store_id]);
    let cartId;
    
    if (cart.length === 0) {
      const [newCart] = await db.query('INSERT INTO shopping_cart (user_id, store_id) VALUES (?, ?)', [user_id, store_id]);
      cartId = newCart.insertId;
    } else {
      cartId = cart[0].id;
    }
    
    // 2. Add item
    await db.query(
      'INSERT INTO shopping_cart_items (cart_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)',
      [cartId, product_id, quantity, unit_price]
    );
    
    res.status(201).json({ message: 'Item added to cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
