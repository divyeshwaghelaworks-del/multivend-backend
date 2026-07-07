const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
    createProduct,
    getMyStoreProducts,
    updateProduct,
    deleteProduct,
    getPublicStoreProducts,
} = require('../controllers/productController');

// Public route — no auth needed (listing page)
router.get('/public/:slug', getPublicStoreProducts);

// Protected routes — owner only
router.post('/store/:storeId', requireAuth, createProduct);
router.get('/store/:storeId', requireAuth, getMyStoreProducts);
router.put('/:id', requireAuth, updateProduct);
router.delete('/:id', requireAuth, deleteProduct);

module.exports = router;