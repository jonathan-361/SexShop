const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../config/authMiddleware");
const { requireRole } = require("../config/authMiddleware");

// ==========================================
// RUTAS PÚBLICAS
// ==========================================
router.post("/register", userController.register);
router.post("/login", userController.login);

// ==========================================
// RUTAS DE ADMINISTRACIÓN (Solo Admin con Token)
// ==========================================
router.get(
  "/",
  authMiddleware,
  requireRole("admin"),
  userController.getAllUsers,
);
router.get(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  userController.getUserById,
);
router.put(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  userController.updateUser,
);
router.delete(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  userController.deleteUser,
);

module.exports = router;
