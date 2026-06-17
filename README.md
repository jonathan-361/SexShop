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
