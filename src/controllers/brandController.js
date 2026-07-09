const db = require("../config/db");
const crypto = require("crypto");

// Get all brands
exports.getAllBrands = async (req, res) => {
  const { page = 1, limit = 15 } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 15;
  const offset = (pageNum - 1) * limitNum;

  try {
    const [rows] = await db.query("SELECT * FROM brands LIMIT ? OFFSET ?", [
      limitNum,
      offset,
    ]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get brand by ID
exports.getBrandById = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM brands WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Brand not found" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create brand
exports.createBrand = async (req, res) => {
  const { name, logo_url } = req.body;
  try {
    const id = crypto.randomUUID();
    await db.query("INSERT INTO brands (id, name, logo_url) VALUES (?, ?, ?)", [
      id,
      name,
      logo_url,
    ]);
    res.status(201).json({ id, message: "Brand created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT brand (Actualización total del registro)
exports.updateBrand = async (req, res) => {
  const { id } = req.params;
  const { name, logo_url } = req.body; // Cambiamos 'description' por 'logo_url'

  // El nombre sigue siendo obligatorio para el registro
  if (!name) {
    return res
      .status(400)
      .json({ message: "El campo name es obligatorio para actualizar." });
  }

  try {
    const [result] = await db.query(
      "UPDATE brands SET name = ?, logo_url = ? WHERE id = ?",
      [name, logo_url || null, id], // Guardamos los datos correctos
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Marca no encontrada." });
    }

    res.json({ message: "Marca actualizada correctamente con PUT." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE brand
exports.deleteBrand = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM brands WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Marca no encontrada." });
    }

    res.json({ message: "Marca eliminada correctamente." });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        message:
          "No se puede eliminar la marca porque tiene productos asociados.",
      });
    }
    res.status(500).json({ error: error.message });
  }
};
