const db = require("../config/db");

/**
 * POST /api/maintenance/alter-cart-table
 * Elimina store_id de shopping_cart (ya ejecutado previamente).
 */
exports.alterCartTable = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM shopping_cart_items");
    await conn.query("DELETE FROM shopping_cart");

    const [cols] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shopping_cart' AND COLUMN_NAME = 'store_id'
    `);

    if (cols.length === 0) {
      await conn.commit();
      return res.json({ message: "store_id ya fue eliminado anteriormente." });
    }

    const [fks] = await conn.query(`
      SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shopping_cart' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `);
    for (const fk of fks) {
      await conn.query(
        `ALTER TABLE shopping_cart DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``,
      );
    }

    const [idxs] = await conn.query(`
      SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shopping_cart' AND INDEX_NAME != 'PRIMARY'
    `);
    for (const idx of idxs) {
      await conn.query(
        `ALTER TABLE shopping_cart DROP INDEX \`${idx.INDEX_NAME}\``,
      );
    }

    await conn.query("ALTER TABLE shopping_cart DROP COLUMN store_id");
    await conn.query(
      "ALTER TABLE shopping_cart ADD UNIQUE KEY uq_cart_user (user_id)",
    );

    const [existingFk] = await conn.query(`
      SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shopping_cart' AND CONSTRAINT_NAME = 'fk_cart_user'
    `);
    if (existingFk.length === 0) {
      await conn.query(
        `ALTER TABLE shopping_cart ADD CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`,
      );
    }

    await conn.commit();
    res.json({ message: "shopping_cart actualizada: store_id eliminado." });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
};

/**
 * DELETE /api/maintenance/clear-all
 * Elimina TODOS los registros respetando FKs. Solo admin.
 */
exports.clearAll = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    const tables = [
      "platform_commissions",
      "shipments",
      "payments",
      "order_items",
      "orders",
      "shopping_cart_items",
      "shopping_cart",
      "product_images",
      "products",
      "brands",
      "categories",
      "customer_addresses",
      "delivery_methods",
      "store_address",
      "stores",
      "users",
    ];

    const results = {};
    for (const table of tables) {
      // Tabla puede no existir en etapa de transición → ignorar error
      try {
        const [r] = await conn.query(`DELETE FROM \`${table}\``);
        results[table] = r.affectedRows;
      } catch (e) {
        results[table] = `skipped (${e.code})`;
      }
    }

    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    await conn.commit();
    res.json({ message: "Todos los registros eliminados.", deleted: results });
  } catch (error) {
    await conn.rollback();
    await conn.query("SET FOREIGN_KEY_CHECKS = 1").catch(() => {});
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
};

/**
 * POST /api/maintenance/migrate-single-store
 * Migra la BD de multi-tienda a tienda única:
 *  - Elimina tablas innecesarias
 *  - Quita columnas store_id y commission_amount
 *  - Cambia ENUM de roles a solo customer/admin
 */
exports.migrateSingleStore = async (req, res) => {
  const conn = await db.getConnection();
  const log = [];

  const run = async (label, sql) => {
    try {
      await conn.query(sql);
      log.push({ step: label, status: "OK" });
    } catch (e) {
      log.push({ step: label, status: "SKIPPED", reason: e.message });
    }
  };

  try {
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    // ── 1. Vaciar y eliminar platform_commissions ──────────────────────────
    await run(
      "delete platform_commissions data",
      "DELETE FROM platform_commissions",
    );
    await run(
      "drop platform_commissions",
      "DROP TABLE IF EXISTS platform_commissions",
    );

    // ── 2. Vaciar y eliminar delivery_methods ──────────────────────────────
    await run("delete delivery_methods data", "DELETE FROM delivery_methods");
    await run("drop delivery_methods", "DROP TABLE IF EXISTS delivery_methods");

    // ── 3. Vaciar y eliminar store_address ─────────────────────────────────
    await run("delete store_address data", "DELETE FROM store_address");
    await run("drop store_address", "DROP TABLE IF EXISTS store_address");

    // ── 4. Quitar store_id de products ────────────────────────────────────
    // 4a. FK
    const [prodFks] = await conn.query(`
      SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        AND CONSTRAINT_NAME = 'fk_products_store'
    `);
    if (prodFks.length > 0) {
      await run(
        "drop fk_products_store",
        "ALTER TABLE products DROP FOREIGN KEY fk_products_store",
      );
    }
    // 4b. Index
    const [prodIdx] = await conn.query(`
      SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND INDEX_NAME = 'idx_products_store'
    `);
    if (prodIdx.length > 0) {
      await run(
        "drop idx_products_store",
        "ALTER TABLE products DROP INDEX idx_products_store",
      );
    }
    // 4c. Column
    const [prodCol] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'store_id'
    `);
    if (prodCol.length > 0) {
      await run(
        "drop products.store_id",
        "ALTER TABLE products DROP COLUMN store_id",
      );
    }

    // ── 5. Quitar store_id de orders ───────────────────────────────────────
    const [ordFk] = await conn.query(`
      SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        AND CONSTRAINT_NAME = 'fk_orders_store'
    `);
    if (ordFk.length > 0) {
      await run(
        "drop fk_orders_store",
        "ALTER TABLE orders DROP FOREIGN KEY fk_orders_store",
      );
    }

    const [ordStoreIdx] = await conn.query(`
      SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_store'
    `);
    if (ordStoreIdx.length > 0) {
      await run(
        "drop idx_orders_store",
        "ALTER TABLE orders DROP INDEX idx_orders_store",
      );
    }

    const [ordStoreCol] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'store_id'
    `);
    if (ordStoreCol.length > 0) {
      await run(
        "drop orders.store_id",
        "ALTER TABLE orders DROP COLUMN store_id",
      );
    }

    // ── 6. Quitar commission_amount de orders ──────────────────────────────
    const [commCol] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'commission_amount'
    `);
    if (commCol.length > 0) {
      await run(
        "drop orders.commission_amount",
        "ALTER TABLE orders DROP COLUMN commission_amount",
      );
    }

    // ── 7. Cambiar ENUM de rol en users → solo customer/admin ─────────────
    await run(
      "alter users role enum",
      `ALTER TABLE users MODIFY COLUMN role ENUM('customer','admin') NOT NULL DEFAULT 'customer'`,
    );

    // ── 8. Vaciar y eliminar stores ────────────────────────────────────────
    await run("delete stores data", "DELETE FROM stores");
    await run("drop stores", "DROP TABLE IF EXISTS stores");

    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    res.json({ message: "Migración a tienda única completada.", log });
  } catch (error) {
    await conn.query("SET FOREIGN_KEY_CHECKS = 1").catch(() => {});
    res.status(500).json({ error: error.message, log });
  } finally {
    conn.release();
  }
};
