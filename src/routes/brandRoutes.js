const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');

router.get('/', brandController.getAllBrands);
router.post('/', brandController.createBrand);

module.exports = router;
