const db = require("../config/db");
const crypto = require("crypto");

// OBTENER PRODUCTO POR ID (Modificado para incluir url_image en el SELECT)
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

    // Mantenemos la consulta de la tabla intermedia por si manejas más imágenes secundarias
    const [images] = await db.query(
      "SELECT id, url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order",
      [req.params.id],
    );

    res.json({ ...products[0], images });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// OBTENER TODOS LOS PRODUCTOS
exports.getAllProducts = async (req, res) => {
  const {
    categories,
    brands,
    name,
    price,
    min_price,
    max_price,
    page = 1,
    limit = 15,
  } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 15;
  const offset = (pageNum - 1) * limitNum;

  // MODIFICADO: Se añade un LEFT JOIN para traer la primera url de product_images como image_url
  let sql = `
    SELECT p.id, p.category_id, p.brand_id, p.name, p.description,
           p.price, p.discount_price, p.stock, p.status, p.created_at,
           b.name AS brand_name, c.name AS category_name,
           img.url AS image_url
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN (
      SELECT product_id, url 
      FROM product_images 
      WHERE id IN (
        SELECT MIN(id) FROM product_images GROUP BY product_id
      )
    ) img ON p.id = img.product_id
    WHERE 1=1
  `;

  const queryParams = [];

  if (categories) {
    const catList = Array.isArray(categories) ? categories : [categories];
    if (catList.length > 0) {
      const placeholders = catList.map(() => "?").join(", ");
      sql += ` AND p.category_id IN (${placeholders})`;
      queryParams.push(...catList);
    }
  }

  if (brands) {
    const brandList = Array.isArray(brands) ? brands : [brands];
    if (brandList.length > 0) {
      const placeholders = brandList.map(() => "?").join(", ");
      sql += ` AND p.brand_id IN (${placeholders})`;
      queryParams.push(...brandList);
    }
  }

  if (name) {
    sql += ` AND p.name LIKE ?`;
    queryParams.push(`%${name}%`);
  }

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

  sql += ` LIMIT ? OFFSET ?`;
  queryParams.push(limitNum, offset);

  try {
    const [rows] = await db.query(sql, queryParams);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREAR PRODUCTO (Modificado para recibir url_image e insertarlo en la tabla)
// 3. CREAR PRODUCTO (Insertando en products y en product_images)
exports.createProduct = async (req, res) => {
  const {
    category_id,
    brand_id,
    name,
    description,
    price,
    discount_price,
    stock,
    images, // Recibimos el arreglo de URLs desde el frontend
  } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: "name y price son obligatorios." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Generamos el ID único para el producto
    const productId = crypto.randomUUID();

    // 2. Insertamos los datos base del producto en la tabla 'products'
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

    // 3. Si el cliente envió imágenes, las registramos en 'product_images'
    if (images && Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const imageId = crypto.randomUUID();
        const imageUrl = images[i];

        // Guardamos cada imagen vinculándola al productId mediante la Foreign Key
        await conn.query(
          "INSERT INTO product_images (id, product_id, url, sort_order) VALUES (?, ?, ?, ?)",
          [imageId, productId, imageUrl, i],
        );
      }
    }

    await conn.commit();
    res.status(201).json({
      id: productId,
      message: "Producto creado correctamente junto con sus imágenes.",
    });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
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
