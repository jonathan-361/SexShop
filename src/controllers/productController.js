const db = require("../config/db");
const crypto = require("crypto");

// Get product by ID (con imágenes)
exports.getProductById = async (req, res) => {
  try {
    const [products] = await db.query(
      `
      SELECT p.*, b.name AS brand_name, c.name AS category_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `,
      [req.params.id],
    );
    if (products.length === 0)
      return res.status(404).json({ message: "Producto no encontrado." });

    const [images] = await db.query(
      "SELECT id, url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order",
      [req.params.id],
    );

    res.json({ ...products[0], images });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/products (Con filtros avanzados dinámicos y PAGINACIÓN)
exports.getAllProducts = async (req, res) => {
  const {
    categories,
    brands,
    name,
    price,
    min_price,
    max_price,
    page = 1, // Página por defecto
    limit = 15, // Límite por defecto
  } = req.query;

  // Convertimos los parámetros de paginación a números enteros
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 15;
  const offset = (pageNum - 1) * limitNum;

  // Base de la consulta SQL
  let sql = `
    SELECT p.id, p.category_id, p.brand_id, p.name, p.description,
           p.price, p.discount_price, p.stock, p.status, p.created_at,
           b.name AS brand_name, c.name AS category_name
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;

  const queryParams = [];

  // 1. Filtro por Categorías
  if (categories) {
    const catList = Array.isArray(categories) ? categories : [categories];
    if (catList.length > 0) {
      const placeholders = catList.map(() => "?").join(", ");
      sql += ` AND p.category_id IN (${placeholders})`;
      queryParams.push(...catList);
    }
  }

  // 2. Filtro por Marcas
  if (brands) {
    const brandList = Array.isArray(brands) ? brands : [brands];
    if (brandList.length > 0) {
      const placeholders = brandList.map(() => "?").join(", ");
      sql += ` AND p.brand_id IN (${placeholders})`;
      queryParams.push(...brandList);
    }
  }

  // 3. Filtro por Nombre
  if (name) {
    sql += ` AND p.name LIKE ?`;
    queryParams.push(`%${name}%`);
  }

  // 4. Filtros por Precio
  if (price) {
    sql += ` AND p.price = ?`;
    queryParams.push(price);
  } else {
    if (min_price && max_price) {
      sql += ` AND p.price BETWEEN ? AND ?`;
      queryParams.push(min_price, max_price);
    } else if (min_price) {
      sql += ` AND p.price >= ?`;
      queryParams.push(min_price);
    } else if (max_price) {
      sql += ` AND p.price <= ?`;
      queryParams.push(max_price);
    }
  }

  // 5. Aplicamos la paginación dinámica al final de la consulta
  sql += ` LIMIT ? OFFSET ?`;
  queryParams.push(limitNum, offset);

  try {
    const [rows] = await db.query(sql, queryParams);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create product (Con soporte para múltiples imágenes usando transacciones)
exports.createProduct = async (req, res) => {
  const {
    category_id,
    brand_id,
    name,
    description,
    price,
    discount_price,
    stock,
    images,
  } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: "name y price son obligatorios." });
  }

  const conn = await db.getConnection(); // Obtenemos una conexión del pool para la transacción
  try {
    await conn.beginTransaction(); // Iniciamos la transacción

    const productId = crypto.randomUUID();

    // 1. Insertar el producto en la tabla 'products'
    await conn.query(
      "INSERT INTO products (id, category_id, brand_id, name, description, price, discount_price, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        productId,
        category_id || null,
        brand_id || null,
        name,
        description || null,
        price,
        discount_price || null,
        stock || 0,
      ],
    );

    // 2. Si se enviaron imágenes, insertarlas en la tabla 'product_images'
    if (images && Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const imageId = crypto.randomUUID();
        const imageUrl = images[i];

        await conn.query(
          "INSERT INTO product_images (id, product_id, url, sort_order) VALUES (?, ?, ?, ?)",
          [imageId, productId, imageUrl, i], // 'i' actúa como el orden (sort_order)
        );
      }
    }

    await conn.commit(); // Confirmamos todos los cambios en la base de datos
    res
      .status(201)
      .json({ id: productId, message: "Producto creado con sus imágenes." });
  } catch (error) {
    await conn.rollback(); // Si algo falla, deshacemos todos los inserts
    res.status(500).json({ error: error.message });
  } finally {
    conn.release(); // Liberamos la conexión de vuelta al pool
  }
};

// PATCH product (Actualización parcial dinámica)
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  // Si el cuerpo viene vacío, no hacemos nada
  if (Object.keys(fields).length === 0) {
    return res
      .status(400)
      .json({ message: "No se enviaron campos para actualizar." });
  }

  // Construimos la query SQL de forma dinámica según los campos recibidos
  const keys = Object.keys(fields);
  const setClause = keys.map((key) => `${key} = ?`).join(", ");
  const values = Object.values(fields);

  // Agregamos el ID al final del arreglo de valores para el WHERE
  values.push(id);

  try {
    const [result] = await db.query(
      `UPDATE products SET ${setClause} WHERE id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    res.json({ message: "Producto actualizado con PATCH." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE product
exports.deleteProduct = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM products WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    res.json({ message: "Producto eliminado correctamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
