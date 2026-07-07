const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { checkout, getMyStoreOrders } = require('../controllers/orderController');

// Public route — shopper checkout, no auth needed
router.post('/checkout/:slug', checkout);

// Protected route — store owner views their own orders
router.get('/store/:storeId', requireAuth, getMyStoreOrders);

module.exports = router;