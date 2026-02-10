const express = require('express');
const path = require('path');
const fs = require('fs');

// Import your existing server setup
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend dist
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

// Your existing API routes
const { DataProvider } = require('./database.cjs');
const db = new DataProvider();

// --- API Routes (existing) ---
app.get('/api/shopkeepers', (req, res) => {
    try {
        const shops = db.getShops();
        res.json(shops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products', (req, res) => {
    try {
        const { search = '', page = 1, limit = 20 } = req.query;
        const products = db.getProducts(search, page, limit);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/shops/:id', (req, res) => {
    try {
        const shop = db.getShopDetail(req.params.id);
        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Distance calculation endpoints
const { calculateDistance } = require('./utils.cjs');

app.post('/api/distance', (req, res) => {
    try {
        const { userLatitude, userLongitude, shopId } = req.body;
        const shop = db.getShopDetail(shopId);
        
        if (!shop || !shop.latitude || !shop.longitude) {
            return res.status(400).json({ error: 'Shop location not found' });
        }
        
        const distance = calculateDistance(
            userLatitude,
            userLongitude,
            shop.latitude,
            shop.longitude
        );
        
        res.json({ distance, shopId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/distances', (req, res) => {
    try {
        const { userLatitude, userLongitude, shopIds } = req.body;
        const distances = [];
        
        shopIds.forEach(id => {
            const shop = db.getShopDetail(id);
            if (shop && shop.latitude && shop.longitude) {
                const distance = calculateDistance(
                    userLatitude,
                    userLongitude,
                    shop.latitude,
                    shop.longitude
                );
                distances.push({ shopId: id, distance });
            }
        });
        
        res.json({ distances });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend for all other routes (SPA routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`⚡ Backend APIs: http://localhost:${PORT}/api/*`);
});

module.exports = app;
