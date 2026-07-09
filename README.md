# SexShop API

API RESTful para la plataforma de tiendas SexShop. Construida con **Node.js + Express + MySQL (Clever Cloud)**.

---

## Requisitos & Configuración

### Instalación
```bash
npm install
```

### Variables de entorno (`.env`)
```env
PORT=3000

DB_HOST=<host_clever_cloud>
DB_NAME=<nombre_bd>
DB_USER=<usuario>
DB_PASSWORD=<contraseña>
DB_PORT=3306

JWT_SECRET=<cadena_secreta_larga>
JWT_EXPIRES_IN=24h

# CORS — orígenes permitidos (separados por coma)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Iniciar servidor
```bash
node src/index.js
```

---

## Seguridad

| Mecanismo | Descripción |
|-----------|-------------|
| **JWT (Bearer Token)** | Todas las rutas protegidas requieren `Authorization: Bearer <token>` |
| **Roles** | `customer`, `store_owner`, `admin`. Endpoints de mantenimiento solo para `admin` |
| **CORS** | Solo orígenes configurados en `ALLOWED_ORIGINS` son aceptados |
| **Helmet** | Cabeceras HTTP de seguridad activadas automáticamente |
| **Rate Limiting** | 200 req/15min por IP (general) · 10 req/15min en login/register |

**Rutas públicas** (sin token): `/api/users/register`, `/api/users/login`  
**Rutas protegidas**: todas las demás (requieren JWT válido)

---

## Endpoints

### 👤 Usuarios `/api/users`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/register` | ❌ Pública | Registro de usuario |
| `POST` | `/login` | ❌ Pública | Login → devuelve JWT |
| `GET` | `/` | ✅ JWT | Listar usuarios (máx. 15) |
| `GET` | `/:id` | ✅ JWT | Obtener usuario por ID |
| `PUT` | `/:id` | ✅ JWT | Actualizar usuario |
| `DELETE` | `/:id` | ✅ JWT | Eliminar usuario |

**Body login/register:**
```json
{
  "names": "Juan",
  "first_lastname": "Pérez",
  "second_lastname": "López",
  "email": "juan@ejemplo.com",
  "password": "MiPassword123!",
  "phone": "5551234567",
  "role": "customer"
}
```

---

### 🏪 Tiendas `/api/stores`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/` | ✅ JWT | Listar tiendas (máx. 15) |
| `GET` | `/:id` | ✅ JWT | Obtener tienda por ID |
| `POST` | `/` | ✅ JWT | Crear tienda |
| `PUT` | `/:id` | ✅ JWT | Actualizar tienda |
| `DELETE` | `/:id` | ✅ JWT | Eliminar tienda |

---

### 📦 Productos `/api/products`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/` | ✅ JWT | Listar productos (máx. 15) |
| `GET` | `/:id` | ✅ JWT | Obtener producto por ID |
| `POST` | `/` | ✅ JWT | Crear producto |
| `PUT` | `/:id` | ✅ JWT | Actualizar producto |
| `DELETE` | `/:id` | ✅ JWT | Eliminar producto |

---

### 🛒 Carrito `/api/cart`

> El `user_id` ya **no se envía en el body** — se extrae del JWT automáticamente.  
> Ya **no existe `store_id`** en el carrito. Cada usuario tiene un carrito global.

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/` | ✅ JWT | Ver carrito del usuario autenticado |
| `POST` | `/` | ✅ JWT | Agregar ítem al carrito |
| `PUT` | `/:product_id` | ✅ JWT | Actualizar cantidad de un ítem |
| `DELETE` | `/:product_id` | ✅ JWT | Eliminar ítem del carrito |

**Body POST /api/cart:**
```json
{
  "product_id": "uuid-del-producto",
  "quantity": 2,
  "unit_price": 299.99
}
```

**Body PUT /api/cart/:product_id:**
```json
{
  "quantity": 5
}
```

---

### 📋 Categorías `/api/categories`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/` | ✅ JWT | Listar categorías (máx. 15) |
| `GET` | `/:id` | ✅ JWT | Obtener categoría por ID |
| `POST` | `/` | ✅ JWT | Crear categoría |
| `PUT` | `/:id` | ✅ JWT | Actualizar categoría |
| `DELETE` | `/:id` | ✅ JWT | Eliminar categoría |

---

### 🏷️ Marcas `/api/brands`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/` | ✅ JWT | Listar marcas (máx. 15) |
| `GET` | `/:id` | ✅ JWT | Obtener marca por ID |
| `POST` | `/` | ✅ JWT | Crear marca |
| `PUT` | `/:id` | ✅ JWT | Actualizar marca |
| `DELETE` | `/:id` | ✅ JWT | Eliminar marca |

---

### 🧾 Pedidos `/api/orders`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/` | ✅ JWT | Listar pedidos (máx. 15) |
| `GET` | `/:id` | ✅ JWT | Obtener pedido por ID |
| `POST` | `/` | ✅ JWT | Crear pedido |
| `PUT` | `/:id` | ✅ JWT | Actualizar pedido |
| `DELETE` | `/:id` | ✅ JWT | Eliminar pedido |

---

### 💳 Pagos `/api/payments`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/` | ✅ JWT | Listar pagos (máx. 15) |
| `GET` | `/:id` | ✅ JWT | Obtener pago por ID |
| `POST` | `/` | ✅ JWT | Registrar pago |
| `PUT` | `/:id` | ✅ JWT | Actualizar pago |
| `DELETE` | `/:id` | ✅ JWT | Eliminar pago |

---

### 🚚 Envíos `/api/shipments`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/` | ✅ JWT | Listar envíos (máx. 15) |
| `GET` | `/:id` | ✅ JWT | Obtener envío por ID |
| `POST` | `/` | ✅ JWT | Crear envío |
| `PUT` | `/:id` | ✅ JWT | Actualizar envío |
| `DELETE` | `/:id` | ✅ JWT | Eliminar envío |

---

### 🔧 Mantenimiento `/api/maintenance`

> ⚠️ Solo accesible con JWT de usuario con `role: "admin"`.

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/alter-cart-table` | ✅ Admin | Aplica la migración de `shopping_cart` (quita `store_id`). Ejecutar **una sola vez** |
| `DELETE` | `/clear-all` | ✅ Admin | Elimina **todos** los registros de la BD (orden correcto de FKs) |

---

## Flujo de autenticación

```
1. POST /api/users/register  →  crear cuenta
2. POST /api/users/login     →  obtener JWT token
3. Incluir en cada request:
   Header: Authorization: Bearer <token>
```

El token expira en `JWT_EXPIRES_IN` (por defecto 24h).

---

## Estructura del proyecto

```
src/
├── config/
│   ├── db.js               # Pool de conexión MySQL
│   └── authMiddleware.js   # JWT middleware + requireRole()
├── controllers/
│   ├── userController.js
│   ├── storeController.js
│   ├── categoryController.js
│   ├── brandController.js
│   ├── productController.js
│   ├── cartController.js
│   ├── orderController.js
│   ├── paymentController.js
│   ├── shipmentController.js
│   └── maintenanceController.js
├── routes/
│   ├── userRoutes.js
│   ├── storeRoutes.js
│   ├── categoryRoutes.js
│   ├── brandRoutes.js
│   ├── productRoutes.js
│   ├── cartRoutes.js
│   ├── orderRoutes.js
│   ├── paymentRoutes.js
│   ├── shipmentRoutes.js
│   └── maintenanceRoutes.js
└── index.js                # Entry point, configuración global
```
