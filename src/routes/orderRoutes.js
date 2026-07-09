const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../config/authMiddleware");

router.get("/:id", authMiddleware, orderController.getOrderById);
router.post("/", authMiddleware, orderController.createOrder);

module.exports = router;
