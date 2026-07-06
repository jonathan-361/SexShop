const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/:id', paymentController.getPaymentById);
router.get('/order/:orderId', paymentController.getPaymentByOrderId);
router.post('/', paymentController.createPayment);

module.exports = router;
