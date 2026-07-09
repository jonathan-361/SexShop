const db = require("../config/db");
const crypto = require("crypto");

// Get all categories
exports.getAllCategories = async (req, res) => {
  const { page = 1, limit = 15 } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 15;
  const offset = (pageNum - 1) * limitNum;

  try {
    const [rows] = await db.query("SELECT * FROM categories LIMIT ? OFFSET ?", [
      limitNum,
      offset,
    ]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categories WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Category not found" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  const { name, description, parent_category_id } = req.body;
  try {
    const id = crypto.randomUUID();
    await db.query(
      "INSERT INTO categories (id, name, description, parent_category_id) VALUES (?, ?, ?, ?)",
      [id, name, description, parent_category_id],
    );
    res.status(201).json({ id, message: "Category created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  const { name, description, parent_category_id } = req.body;
  const { id } = req.params;

  if (!name) {
    return res
      .status(400)
      .json({ message: "El nombre de la categoría es obligatorio." });
  }

  try {
    const [result] = await db.query(
      "UPDATE categories SET name = ?, description = ?, parent_category_id = ? WHERE id = ?",
      [name, description || null, parent_category_id || null, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM categories WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    // Si intentas borrar una categoría que es padre de otra o está asociada a un producto
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        message:
          "No se puede eliminar la categoría porque tiene subcategorías o productos asociados.",
      });
    }
    res.status(500).json({ error: error.message });
  }
};
