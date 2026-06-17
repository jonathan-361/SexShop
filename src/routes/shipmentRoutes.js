const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');

router.post('/', shipmentController.createShipment);
router.put('/:id', shipmentController.updateShipmentStatus);

module.exports = router;
