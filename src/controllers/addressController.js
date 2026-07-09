const db = require("../config/db");

/**
 * GET /api/addresses
 * Obtiene todas las direcciones guardadas del usuario autenticado.
 */
exports.getMyAddresses = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM customer_addresses WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
