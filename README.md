# SexShop API

Este es el backend para el proyecto SexShop, construido con Node.js, Express y MySQL (Clever Cloud).

## Requisitos Previos

- [Node.js](https://nodejs.org/) (v14 o superior)
- [npm](https://www.npmjs.com/)
- Una base de datos MySQL activa (puedes usar el archivo `esquema_db_mysql.sql` para crear las tablas).

## Pasos para Ejecutar

1. **Instalar Dependencias**
   Abre una terminal en la carpeta raíz del proyecto y ejecuta:
   ```bash
   npm install
   ```

2. **Configurar el Entorno**
   Asegúrate de que el archivo `.env` tenga las credenciales correctas de tu base de datos Clever Cloud:
   ```env
   PORT=3000
   DB_HOST=tu_host
   DB_USER=tu_usuario
   DB_PASSWORD=tu_password
   DB_NAME=tu_base_de_datos
   ```

3. **Iniciar el Servidor**
   Para producción:
   ```bash
   npm start
   ```
   Para desarrollo (requiere `nodemon` instalado):
   ```bash
   npm run dev
   ```

## Estructura del Proyecto

- `src/index.js`: Punto de entrada de la aplicación.
- `src/routes/`: Definición de los endpoints.
- `src/controllers/`: Lógica de negocio.
- `src/config/db.js`: Configuración de la conexión a la base de datos.
- `esquema_db_mysql.sql`: Script SQL para la base de datos.

## Endpoints de la API

A continuación se detallan los endpoints disponibles y actualizados, incluyendo la limitación a un máximo de 15 registros por petición en listados generales para mejorar el rendimiento del frontend.

### 👤 Usuarios (`/api/users`)
- **GET `/api/users`** - Obtiene los usuarios (Límite: 15 registros).
- **GET `/api/users/:id`** - Obtiene información individual de un usuario por su ID.
- **POST `/api/users/register`** - Registra un nuevo usuario.
- **POST `/api/users/login`** - Inicia sesión de usuario (Retorna JWT).
- **POST `/api/users`** - Registra o crea un usuario (Admin/Compatibilidad).
- **PUT `/api/users/:id`** - Actualiza datos de un usuario por su ID.
- **DELETE `/api/users/:id`** - Elimina un usuario por su ID.

### 🏪 Tiendas (`/api/stores`)
- **GET `/api/stores`** - Obtiene tiendas (Límite: 15 registros).
- **GET `/api/stores/:id`** - Obtiene información individual de una tienda por su ID.
- **POST `/api/stores`** - Crea una nueva tienda.
- **PUT `/api/stores/:id`** - Actualiza datos de una tienda por su ID.
- **DELETE `/api/stores/:id`** - Elimina una tienda de forma lógica/física por su ID.

### 🏷️ Categorías (`/api/categories`)
- **GET `/api/categories`** - Obtiene las categorías de productos (Límite: 15 registros).
- **GET `/api/categories/:id`** - Obtiene información individual de una categoría por su ID.
- **POST `/api/categories`** - Crea una nueva categoría.

### 🛡️ Marcas (`/api/brands`)
- **GET `/api/brands`** - Obtiene las marcas de productos (Límite: 15 registros).
- **GET `/api/brands/:id`** - Obtiene información individual de una marca por su ID.
- **POST `/api/brands`** - Registra una nueva marca.

### 📦 Productos (`/api/products`)
- **GET `/api/products`** - Obtiene catálogo de productos (Límite: 15 registros).
- **GET `/api/products/:id`** - Obtiene información individual y detallada de un producto con sus imágenes por su ID.
- **POST `/api/products`** - Crea un nuevo producto.

### 🛒 Carrito de Compras (`/api/cart`)
- **GET `/api/cart?user_id=X&store_id=Y`** - Obtiene el carrito activo de un usuario para una tienda.
- **POST `/api/cart/add`** - Agrega un producto o unidades al carrito.

### 🧾 Pedidos (`/api/orders`)
- **GET `/api/orders/:id`** - Obtiene los detalles de un pedido y sus ítems por su ID.
- **POST `/api/orders`** - Crea un pedido a partir del carrito.

### 💳 Pagos (`/api/payments`)
- **GET `/api/payments/:id`** - Obtiene detalles individuales de un pago por su ID.
- **GET `/api/payments/order/:orderId`** - Obtiene el pago relacionado a un pedido.
- **POST `/api/payments`** - Registra un pago relacionado a un pedido.

### 🚚 Envíos (`/api/shipments`)
- **GET `/api/shipments/:id`** - Obtiene detalles individuales de un envío por su ID.
- **GET `/api/shipments/order/:orderId`** - Obtiene detalles de envío por el ID del pedido.
- **POST `/api/shipments`** - Crea información de envío para un pedido.
- **PUT `/api/shipments/:id`** - Actualiza el estado (shipment_status) de un envío.
