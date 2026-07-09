-- ============================================
--  PLATAFORMA DE TIENDAS DE JUGUETES
--  Esquema SQL — MySQL 8.0+
--  (Convertido desde PostgreSQL)
-- ============================================

SET NAMES utf8mb4;

-- ============================================
-- USUARIOS
-- ============================================

CREATE TABLE users (
  id               CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  names            VARCHAR(120) NOT NULL,
  first_lastname   VARCHAR(80)  NOT NULL,
  second_lastname  VARCHAR(80),
  email            VARCHAR(255) NOT NULL UNIQUE,
  password         VARCHAR(255) NOT NULL,
  phone            VARCHAR(20),
  role             ENUM('customer', 'store_owner', 'admin') NOT NULL DEFAULT 'customer',
  status           ENUM('active', 'inactive', 'banned')     NOT NULL DEFAULT 'active',
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- TIENDAS
-- ============================================

CREATE TABLE stores (
  id                CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  owner_id          CHAR(36)     NOT NULL,
  store_name        VARCHAR(150) NOT NULL,
  store_description TEXT,
  logo_url          VARCHAR(500),
  banner_url        VARCHAR(500),
  email             VARCHAR(255),
  phone             VARCHAR(20),
  commission_rate   DECIMAL(5,2) NOT NULL DEFAULT 10.00,  -- porcentaje, ej: 10.00 = 10%
  status            ENUM('active', 'inactive', 'pending_review') NOT NULL DEFAULT 'pending_review',
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_stores_owner ON stores(owner_id);


-- ============================================
-- DIRECCIÓN DE TIENDA (1 a 1 con stores)
-- ============================================

CREATE TABLE store_address (
  id               CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  store_id         CHAR(36)     NOT NULL UNIQUE,
  street           VARCHAR(200) NOT NULL,
  external_number  VARCHAR(20)  NOT NULL,
  internal_number  VARCHAR(20),
  neighborhood     VARCHAR(150) NOT NULL,
  postal_code      VARCHAR(10)  NOT NULL,
  latitude         DECIMAL(10,7),
  longitude        DECIMAL(10,7),
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_store_address_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- MÉTODOS DE ENTREGA POR TIENDA
-- ============================================

CREATE TABLE delivery_methods (
  id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  store_id      CHAR(36) NOT NULL,
  delivery_type ENUM('pickup', 'store_delivery', 'platform_delivery') NOT NULL,
  enabled       BOOLEAN  NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_delivery_methods_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE (store_id, delivery_type)  -- una tienda no puede tener el mismo método dos veces
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_delivery_methods_store ON delivery_methods(store_id);


-- ============================================
-- CATEGORÍAS (auto-referencial para subcategorías)
-- ============================================

CREATE TABLE categories (
  id                  CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  name                VARCHAR(100) NOT NULL,
  description         TEXT,
  parent_category_id  CHAR(36),
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_categories_parent ON categories(parent_category_id);


-- ============================================
-- MARCAS
-- ============================================

CREATE TABLE brands (
  id        CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  name      VARCHAR(100) NOT NULL UNIQUE,
  logo_url  VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- PRODUCTOS
-- ============================================

CREATE TABLE products (
  id              CHAR(36)       PRIMARY KEY DEFAULT (UUID()),
  store_id        CHAR(36)       NOT NULL,
  category_id     CHAR(36),
  brand_id        CHAR(36),
  name            VARCHAR(200)   NOT NULL,
  description     TEXT,
  price           DECIMAL(10,2)  NOT NULL CHECK (price >= 0),
  discount_price  DECIMAL(10,2)  CHECK (discount_price >= 0),
  stock           INT            NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status          ENUM('active', 'inactive', 'out_of_stock') NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_store    FOREIGN KEY (store_id)    REFERENCES stores(id)     ON DELETE CASCADE,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_brand    FOREIGN KEY (brand_id)    REFERENCES brands(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_products_store    ON products(store_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand    ON products(brand_id);
CREATE INDEX idx_products_status   ON products(status);


-- ============================================
-- IMÁGENES DE PRODUCTOS
-- ============================================

CREATE TABLE product_images (
  id          CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  product_id  CHAR(36)     NOT NULL,
  url         VARCHAR(500) NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_product_images_product ON product_images(product_id);


-- ============================================
-- DIRECCIONES DE COMPRADORES
-- ============================================
-- Nota: la columna "references" del original se renombró a "reference_notes"
-- porque REFERENCES es palabra reservada en MySQL.

CREATE TABLE customer_addresses (
  id               CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  user_id          CHAR(36)     NOT NULL,
  street           VARCHAR(200) NOT NULL,
  external_number  VARCHAR(20)  NOT NULL,
  internal_number  VARCHAR(20),
  neighborhood     VARCHAR(150) NOT NULL,
  postal_code      VARCHAR(10)  NOT NULL,
  reference_notes  TEXT,
  latitude         DECIMAL(10,7),
  longitude        DECIMAL(10,7),
  is_default       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_customer_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_customer_addresses_user ON customer_addresses(user_id);


-- ============================================
-- CARRITO DE COMPRA
-- ============================================
-- Nota: store_id eliminado (2026-07-09). Cada usuario tiene un único carrito global.
-- El carrito no está ligado a una tienda; los productos en él pertenecen a distintas tiendas.

CREATE TABLE shopping_cart (
  id          CHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  user_id     CHAR(36)  NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_cart_user (user_id)  -- un usuario tiene un solo carrito activo
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_shopping_cart_user ON shopping_cart(user_id);


-- ============================================
-- ÍTEMS DEL CARRITO
-- ============================================

CREATE TABLE shopping_cart_items (
  id          CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
  cart_id     CHAR(36)      NOT NULL,
  product_id  CHAR(36)      NOT NULL,
  quantity    INT           NOT NULL CHECK (quantity > 0),
  unit_price  DECIMAL(10,2) NOT NULL,  -- precio al momento de agregar
  CONSTRAINT fk_cart_items_cart    FOREIGN KEY (cart_id)    REFERENCES shopping_cart(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id)      ON DELETE CASCADE,
  UNIQUE (cart_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cart_items_cart ON shopping_cart_items(cart_id);


-- ============================================
-- PEDIDOS
-- ============================================

CREATE TABLE orders (
  id                       CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
  customer_id              CHAR(36)      NOT NULL,
  store_id                 CHAR(36)      NOT NULL,
  address_id               CHAR(36),
  subtotal_amount          DECIMAL(10,2) NOT NULL,
  shipping_amount          DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount               DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount          DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount             DECIMAL(10,2) NOT NULL,
  commission_amount        DECIMAL(10,2) NOT NULL DEFAULT 0,  -- monto que se lleva la plataforma
  order_status             ENUM('pending', 'confirmed', 'preparing', 'ready',
                                 'in_transit', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  estimated_delivery_time  TIMESTAMP NULL,
  notes                    TEXT,
  created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  CONSTRAINT fk_orders_store    FOREIGN KEY (store_id)    REFERENCES stores(id),
  CONSTRAINT fk_orders_address  FOREIGN KEY (address_id)  REFERENCES customer_addresses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_store    ON orders(store_id);
CREATE INDEX idx_orders_status   ON orders(order_status);


-- ============================================
-- DETALLE DEL PEDIDO
-- ============================================

CREATE TABLE order_items (
  id            CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
  order_id      CHAR(36)      NOT NULL,
  product_id    CHAR(36),
  product_name  VARCHAR(200)  NOT NULL,   -- nombre congelado al momento de compra
  unit_price    DECIMAL(10,2) NOT NULL,   -- precio congelado al momento de compra
  quantity      INT           NOT NULL CHECK (quantity > 0),
  subtotal      DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_order_items_order ON order_items(order_id);


-- ============================================
-- PAGOS
-- ============================================

CREATE TABLE payments (
  id              CHAR(36)       PRIMARY KEY DEFAULT (UUID()),
  order_id        CHAR(36)       NOT NULL UNIQUE,
  payment_method  ENUM('cash', 'card', 'transfer', 'wallet') NOT NULL,
  transaction_id  VARCHAR(200),  -- referencia externa de pasarela (Stripe, Conekta, etc.)
  amount          DECIMAL(10,2)  NOT NULL,
  payment_status  ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  paid_at         TIMESTAMP NULL,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_payments_order ON payments(order_id);


-- ============================================
-- ENVÍOS
-- ============================================

CREATE TABLE shipments (
  id               CHAR(36)         PRIMARY KEY DEFAULT (UUID()),
  order_id         CHAR(36)         NOT NULL UNIQUE,
  shipment_type    ENUM('pickup', 'store_delivery', 'platform_delivery') NOT NULL,
  shipment_status  ENUM('pending', 'assigned', 'in_transit', 'delivered', 'failed') NOT NULL DEFAULT 'pending',
  courier_name     VARCHAR(100),    -- solo para platform_delivery
  tracking_code    VARCHAR(100),    -- solo para platform_delivery
  shipped_at       TIMESTAMP NULL,
  delivered_at     TIMESTAMP NULL,
  delivery_notes   TEXT,
  created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipments_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_shipments_order ON shipments(order_id);


-- ============================================
-- COMISIONES DE LA PLATAFORMA
-- ============================================

CREATE TABLE platform_commissions (
  id                CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
  order_id          CHAR(36)      NOT NULL,
  store_id          CHAR(36)      NOT NULL,
  commission_rate   DECIMAL(5,2)  NOT NULL,  -- tasa histórica al momento del pedido
  commission_amount DECIMAL(10,2) NOT NULL,
  status            ENUM('pending', 'paid', 'disputed') NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_commissions_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_commissions_store FOREIGN KEY (store_id) REFERENCES stores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_commissions_order ON platform_commissions(order_id);
CREATE INDEX idx_commissions_store ON platform_commissions(store_id);

-- ============================================
-- NOTA SOBRE updated_at
-- ============================================
-- En PostgreSQL el script original necesitaba una función + un trigger por
-- tabla para actualizar "updated_at" automáticamente. En MySQL eso ya viene
-- integrado en la propia columna con la cláusula "ON UPDATE CURRENT_TIMESTAMP"
-- (ver cada tabla arriba), así que no se necesitan funciones ni triggers.
