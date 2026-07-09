const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../config/authMiddleware');

// Todas las rutas del carrito requieren autenticación JWT
router.get('/', authMiddleware, cartController.getCart);
router.post('/', authMiddleware, cartController.addItemToCart);
router.put('/:product_id', authMiddleware, cartController.updateCartItem);
router.delete('/:product_id', authMiddleware, cartController.removeCartItem);

module.exports = router;
