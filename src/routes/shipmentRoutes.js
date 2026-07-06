const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');

router.get('/:id', shipmentController.getShipmentById);
router.get('/order/:orderId', shipmentController.getShipmentByOrderId);
router.post('/', shipmentController.createShipment);
router.put('/:id', shipmentController.updateShipmentStatus);

module.exports = router;
