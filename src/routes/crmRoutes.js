const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { getAllOrders, getRevenue } = require('../controllers/crmController');

router.get('/orders', requireAuth, requireAdmin, getAllOrders);
router.get('/revenue', requireAuth, requireAdmin, getRevenue);

module.exports = router;