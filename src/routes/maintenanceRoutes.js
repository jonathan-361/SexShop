const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const authMiddleware = require('../config/authMiddleware');
const { requireRole } = require('../config/authMiddleware');

// Ambas rutas requieren JWT válido + rol admin
router.post('/alter-cart-table', authMiddleware, requireRole('admin'), maintenanceController.alterCartTable);
router.delete('/clear-all', authMiddleware, requireRole('admin'), maintenanceController.clearAll);

module.exports = router;
