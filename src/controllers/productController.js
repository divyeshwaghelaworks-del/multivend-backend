const prisma = require('../config/prisma');

// Create a product — only the store's owner can add products to it
async function createProduct(req, res) {
    const { storeId } = req.params;
    const ownerId = req.user.userId;
    const { name, description, price, image, stock, category } = req.body;

    if (!name || price === undefined) {
        return res.status(400).json({ error: 'Product name and price are required' });
    }
    if (price < 0) {
        return res.status(400).json({ error: 'Price must be zero or greater' });
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
        return res.status(404).json({ error: 'Store not found' });
    }
    if (store.ownerId !== ownerId) {
        return res.status(403).json({ error: 'You do not own this store' });
    }

    const product = await prisma.product.create({
        data: {
            name,
            description: description || null,
            price,
            image: image || null,
            stock: stock ?? 0,
            category: category || null,
            storeId,
        },
    });
    res.status(201).json({ product });
}

// Get all products for a store — owner-only view (used in the dashboard)
async function getMyStoreProducts(req, res) {
    const { storeId } = req.params;
    const ownerId = req.user.userId;

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
        return res.status(404).json({ error: 'Store not found' });
    }
    if (store.ownerId !== ownerId) {
        return res.status(403).json({ error: 'You do not own this store' });
    }

    const products = await prisma.product.findMany({ where: { storeId } });
    res.json({ products });
}

// Update a product — only the owning store's owner can edit it
async function updateProduct(req, res) {
    const { id } = req.params;
    const ownerId = req.user.userId;
    const { name, description, price, image, stock, category } = req.body;

    const product = await prisma.product.findUnique({
        where: { id },
        include: { store: true },
    });
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    if (product.store.ownerId !== ownerId) {
        return res.status(403).json({ error: 'You do not own this product' });
    }
    if (price !== undefined && price < 0) {
        return res.status(400).json({ error: 'Price must be zero or greater' });
    }

    const updated = await prisma.product.update({
        where: { id },
        data: {
            name: name ?? product.name,
            description: description ?? product.description,
            price: price ?? product.price,
            image: image ?? product.image,
            stock: stock ?? product.stock,
            category: category ?? product.category,
        },
    });
    res.json({ product: updated });
}

// Delete a product — only the owning store's owner can delete it
async function deleteProduct(req, res) {
    const { id } = req.params;
    const ownerId = req.user.userId;

    const product = await prisma.product.findUnique({
        where: { id },
        include: { store: true },
    });
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    if (product.store.ownerId !== ownerId) {
        return res.status(403).json({ error: 'You do not own this product' });
    }

    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted' });
}

// Public route — anyone can view a store's products (listing page), with optional search/category filter
async function getPublicStoreProducts(req, res) {
    const { slug } = req.params;
    const { search, category } = req.query;

    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) {
        return res.status(404).json({ error: 'Store not found' });
    }

    const where = { storeId: store.id };
    if (category) {
        where.category = category;
    }
    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }

    const products = await prisma.product.findMany({ where });
    res.json({ products });
}

module.exports = {
    createProduct,
    getMyStoreProducts,
    updateProduct,
    deleteProduct,
    getPublicStoreProducts,
};