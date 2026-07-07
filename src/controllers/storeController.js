const prisma = require('../config/prisma');
const slugify = require('slugify');

// Create a store for the logged-in user
async function createStore(req, res) {
    const { name, logo, primaryColor, tagline } = req.body;
    const ownerId = req.user.userId;

    if (!name) {
        return res.status(400).json({ error: 'Store name is required' });
    }

    let baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (await prisma.store.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    const store = await prisma.store.create({
        data: {
            name,
            slug,
            logo: logo || null,
            primaryColor: primaryColor || '#4F46E5',
            tagline: tagline || null,
            ownerId,
        },
    });

    res.status(201).json({ store });
}

// Get the logged-in user's own store(s)
async function getMyStores(req, res) {
    const ownerId = req.user.userId;
    const stores = await prisma.store.findMany({ where: { ownerId } });
    res.json({ stores });
}

// Update store branding — only the owner can update their own store
async function updateStore(req, res) {
    const { id } = req.params;
    const ownerId = req.user.userId;
    const { name, logo, primaryColor, tagline } = req.body;

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) {
        return res.status(404).json({ error: 'Store not found' });
    }
    if (store.ownerId !== ownerId) {
        return res.status(403).json({ error: 'You do not own this store' });
    }

    const updated = await prisma.store.update({
        where: { id },
        data: {
            name: name ?? store.name,
            logo: logo ?? store.logo,
            primaryColor: primaryColor ?? store.primaryColor,
            tagline: tagline ?? store.tagline,
        },
    });

    res.json({ store: updated });
}

// Public route — anyone can view a store's public info by slug
async function getStoreBySlug(req, res) {
    const { slug } = req.params;
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) {
        return res.status(404).json({ error: 'Store not found' });
    }
    res.json({ store });
}

module.exports = { createStore, getMyStores, updateStore, getStoreBySlug };