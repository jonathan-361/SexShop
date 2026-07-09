const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const db = require("./config/db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Si no estás en producción, agregamos automáticamente los puertos locales de Vite
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:5173", "http://127.0.0.1:5173");
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (ej: Postman, apps móviles) o de orígenes permitidos
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origen no permitido → ${origin}`));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// ─── SEGURIDAD HTTP (Helmet) ──────────────────────────────────────────────────
app.use(helmet());

// ─── LOGGING ─────────────────────────────────────────────────────────────────
app.use(morgan("dev"));

// ─── PARSEO DE BODY ──────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
// Límite general: 200 req / 15 min por IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
});

// Límite estricto para auth: 10 intentos / 15 min por IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Demasiados intentos de autenticación. Intenta de nuevo más tarde.",
  },
  skipSuccessfulRequests: true,
});

app.use(generalLimiter);

// ─── RUTAS ────────────────────────────────────────────────────────────────────
const userRoutes = require("./routes/userRoutes");
const storeRoutes = require("./routes/storeRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const brandRoutes = require("./routes/brandRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");

// Rutas de autenticación (rate limit estricto)
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);

app.use("/api/users", userRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/maintenance", maintenanceRoutes);

// ─── RUTA BASE ────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "SexShop API v2.0",
    status: "online",
    docs: "Ver README.md para lista de endpoints",
  });
});

// ─── MANEJO DE ERRORES CORS ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.message && err.message.startsWith("CORS:")) {
    return res.status(403).json({ message: err.message });
  }
  next(err);
});

// ─── MANEJO GLOBAL DE ERRORES ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Error interno del servidor." });
});

// ─── INICIO DEL SERVIDOR ──────────────────────────────────────────────────────
db.getConnection()
  .then((conn) => {
    console.log("✅  Conectado a Clever Cloud MySQL");
    conn.release();
    app.listen(PORT, () => {
      console.log(`🚀  Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌  Error al conectar con la base de datos:", err.message);
    process.exit(1);
  });
