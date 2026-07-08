const prisma = require('../config/prisma');

// GET /api/crm/orders?storeId=xxx (optional filter)
async function getAllOrders(req, res) {
    const { storeId } = req.query;
    const where = storeId ? { storeId } : {};

    const orders = await prisma.order.findMany({
        where,
        include: {
            store: { select: { id: true, name: true, slug: true } },
            items: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json({ orders });
}

// GET /api/crm/revenue
async function getRevenue(req, res) {
    const orders = await prisma.order.findMany({
        select: { storeId: true, total: true, store: { select: { name: true, slug: true } } },
    });

    const byStore = {};
    let grandTotal = 0;

    for (const order of orders) {
        grandTotal += order.total;
        if (!byStore[order.storeId]) {
            byStore[order.storeId] = {
                storeId: order.storeId,
                storeName: order.store.name,
                slug: order.store.slug,
                revenue: 0,
                orderCount: 0,
            };
        }
        byStore[order.storeId].revenue += order.total;
        byStore[order.storeId].orderCount += 1;
    }

    res.json({
        grandTotal,
        byStore: Object.values(byStore),
    });
}

// GET /api/crm/stores — list every store on the platform, with owner info
async function getAllStores(req, res) {
    const stores = await prisma.store.findMany({
        include: {
            owner: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ stores });
}

module.exports = { getAllOrders, getRevenue, getAllStores };