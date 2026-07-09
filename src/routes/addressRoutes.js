const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const authMiddleware = require("../config/authMiddleware"); // Asegura que esté autenticado

router.get("/", authMiddleware, addressController.getMyAddresses);

module.exports = router;
