const db = require("../config/db");
const crypto = require("crypto");

/**
 * POST /api/orders
 * Crea un pedido desde el carrito del usuario autenticado.
 * Body si usa dirección guardada: { address_id, shipping_amount, notes }
 * Body si escribe nueva dirección: { shipping_address: { street, external_number, internal_number, neighborhood, postal_code, reference_notes, latitude, longitude }, shipping_amount, notes }
 */
exports.createOrder = async (req, res) => {
  const {
    address_id,
    shipping_address, // Objeto acoplado a las columnas reales de customer_addresses
    shipping_amount = 0,
    tax_amount = 0,
    discount_amount = 0,
    notes,
  } = req.body;
  const customerId = req.user.id;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Validar y procesar la dirección de envío
    let finalAddressId = address_id;

    // Si no mandó un ID pero sí escribió una nueva dirección en el formulario
    if (!finalAddressId && shipping_address) {
      finalAddressId = crypto.randomUUID();

      await conn.query(
        `INSERT INTO customer_addresses 
          (id, user_id, street, external_number, internal_number, neighborhood, postal_code, reference_notes, latitude, longitude) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalAddressId,
          customerId,
          shipping_address.street,
          shipping_address.external_number,
          shipping_address.internal_number || null,
          shipping_address.neighborhood,
          shipping_address.postal_code,
          shipping_address.reference_notes || null,
          shipping_address.latitude || null,
          shipping_address.longitude || null,
        ],
      );
    }

    // Si no se cumple ninguna de las dos opciones, detenemos el proceso
    if (!finalAddressId) {
      return res.status(400).json({
        message:
          "Debe seleccionar una dirección existente (address_id) o ingresar una nueva (shipping_address).",
      });
    }

    // 2. Buscar el carrito activo del usuario
    const [cart] = await conn.query(
      "SELECT id FROM shopping_cart WHERE user_id = ?",
      [customerId],
    );

    if (cart.length === 0) {
      return res.status(400).json({
        message: "No se encontró un carrito activo para este usuario.",
      });
    }

    const cartId = cart[0].id;

    // 3. Traer los productos agregados a ese carrito JUNTO con el precio y stock REAL del inventario
    const [cartItems] = await conn.query(
      `SELECT sci.product_id, p.name AS product_name, p.price AS current_price, p.stock, sci.quantity
       FROM shopping_cart_items sci
       JOIN products p ON sci.product_id = p.id
       WHERE sci.cart_id = ?`,
      [cartId],
    );

    if (cartItems.length === 0) {
      return res.status(400).json({
        message: "El carrito está vacío. No se puede crear la orden.",
      });
    }

    // 4. Validar stock disponible y calcular el subtotal con los precios reales del inventario
    let subtotal = 0;
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para el producto: ${item.product_name}. Disponibles: ${item.stock}`,
        );
      }
      subtotal += item.current_price * item.quantity;
    }

    // Calcular el gran total general
    const total =
      subtotal +
      Number(shipping_amount) +
      Number(tax_amount) -
      Number(discount_amount);

    // 5. Insertar el encabezado de la Orden utilizando 'finalAddressId'
    const orderId = crypto.randomUUID();
    await conn.query(
      `INSERT INTO orders
        (id, customer_id, address_id, subtotal_amount, shipping_amount, tax_amount, discount_amount, total_amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        customerId,
        finalAddressId,
        subtotal,
        shipping_amount,
        tax_amount,
        discount_amount,
        total,
        notes || null,
      ],
    );

    // 6. Copiar los ítems a 'order_items' y reducir las existencias de la tabla 'products'
    for (const item of cartItems) {
      const itemId = crypto.randomUUID();
      const itemSubtotal = item.current_price * item.quantity;

      // Guardar registro histórico en los detalles de la compra
      await conn.query(
        "INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          itemId,
          orderId,
          item.product_id,
          item.product_name,
          item.current_price,
          item.quantity,
          itemSubtotal,
        ],
      );

      // Descontar del stock físico
      await conn.query("UPDATE products SET stock = stock - ? WHERE id = ?", [
        item.quantity,
        item.product_id,
      ]);
    }

    // 7. Limpiar por completo las relaciones de artículos de este carrito
    await conn.query("DELETE FROM shopping_cart_items WHERE cart_id = ?", [
      cartId,
    ]);

    // Consolidamos todos los cambios de la transacción SQL
    await conn.commit();

    res.status(201).json({
      id: orderId,
      total,
      message:
        "Pedido creado correctamente con los productos de tu carrito. Carrito vaciado.",
    });
  } catch (error) {
    await conn.rollback(); // Cancela cualquier cambio si falla el stock o la base de datos
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
};

// Get all orders (admin) (Con Paginación)
exports.getAllOrders = async (req, res) => {
  const { page = 1, limit = 15 } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 15;
  const offset = (pageNum - 1) * limitNum;

  try {
    const [rows] = await db.query(
      `
      SELECT o.*, u.names, u.first_lastname, u.email
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `,
      [limitNum, offset],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get order by ID (con ítems)
exports.getOrderById = async (req, res) => {
  try {
    const [order] = await db.query("SELECT * FROM orders WHERE id = ?", [
      req.params.id,
    ]);
    if (order.length === 0)
      return res.status(404).json({ message: "Pedido no encontrado." });

    const [items] = await db.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [req.params.id],
    );
    res.json({ ...order[0], items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get orders for the authenticated user
exports.getMyOrders = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC",
      [req.user.id],
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
      "UPDATE orders SET order_status = ?, notes = ? WHERE id = ?",
      [order_status, notes || null, req.params.id],
    );
    res.json({ message: "Estado del pedido actualizado." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete order (admin)
exports.deleteOrder = async (req, res) => {
  try {
    await db.query("DELETE FROM orders WHERE id = ?", [req.params.id]);
    res.json({ message: "Pedido eliminado." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
