const prisma = require('../config/prisma');

// Public route — shopper checks out with their cart, creates an Order + OrderItems
async function checkout(req, res) {
    const { slug } = req.params;
    const { shopperName, shopperEmail, items } = req.body;

    if (!shopperName || !shopperEmail) {
        return res.status(400).json({ error: 'Shopper name and email are required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Cart must contain at least one item' });
    }

    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) {
        return res.status(404).json({ error: 'Store not found' });
    }

    // Look up each product fresh from the DB so price/stock can't be spoofed by the client
    let total = 0;
    const orderItemsData = [];

    for (const item of items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });

        if (!product || product.storeId !== store.id) {
            return res.status(400).json({ error: `Invalid product in cart: ${item.productId}` });
        }
        if (!item.quantity || item.quantity < 1) {
            return res.status(400).json({ error: `Invalid quantity for product: ${product.name}` });
        }
        if (product.stock < item.quantity) {
            return res.status(400).json({ error: `Not enough stock for ${product.name}` });
        }

        const lineTotal = product.price * item.quantity;
        total += lineTotal;

        orderItemsData.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
        });
    }

    // Create the order and its items, and decrement stock, all together
    const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
            data: {
                storeId: store.id,
                shopperName,
                shopperEmail,
                total,
                items: {
                    create: orderItemsData,
                },
            },
            include: { items: true },
        });

        for (const item of orderItemsData) {
            await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
            });
        }

        return newOrder;
    });

    res.status(201).json({ order });
}

// Owner-only — view all orders for one of their stores
async function getMyStoreOrders(req, res) {
    const { storeId } = req.params;
    const ownerId = req.user.userId;

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
        return res.status(404).json({ error: 'Store not found' });
    }
    if (store.ownerId !== ownerId) {
        return res.status(403).json({ error: 'You do not own this store' });
    }

    const orders = await prisma.order.findMany({
        where: { storeId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
}

module.exports = { checkout, getMyStoreOrders };