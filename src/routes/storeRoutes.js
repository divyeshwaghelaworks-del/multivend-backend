const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
    createStore,
    getMyStores,
    updateStore,
    getStoreBySlug,
} = require('../controllers/storeController');

const router = express.Router();

// Protected — owner only
router.post('/', requireAuth, createStore);
router.get('/mine', requireAuth, getMyStores);
router.put('/:id', requireAuth, updateStore);

// Public — anyone can view a store by slug
router.get('/public/:slug', getStoreBySlug);

module.exports = router;