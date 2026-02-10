const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database.cjs');
const { calculateDistance, validateCoordinates, formatDistance } = require('./utils.cjs');

const compression = require('compression');
const app = express();
const PORT = 3001;

// --- Performance Middleware ---
app.use(compression());
app.use(cors());
app.use(bodyParser.json());
// Serve static files with efficient caching headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1d' }));
app.use(express.static(path.join(__dirname, '../dist'), { maxAge: '0' }));

// --- Simple In-Memory Cache ---
const cache = {
    shops: { data: null, expiry: 0 },
    offers: { data: null, expiry: 0 }
};
const CACHE_DURATION = 30 * 1000; // 30 seconds

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// --- Helper for DB Promises ---
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) { err ? reject(err) : resolve(this); });
});

// --- Auth Routes ---

// Register User
app.post('/api/register/user', async (req, res) => {
    const { name, mobile, password } = req.body;
    if (!/^\d{10}$/.test(mobile)) return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });

    try {
        const existing = await dbGet(`SELECT id FROM users WHERE mobile = ? UNION SELECT id FROM shopkeepers WHERE mobile = ?`, [mobile, mobile]);
        if (existing) return res.status(400).json({ error: 'Mobile registered. Please login.' });

        const result = await dbRun(`INSERT INTO users (name, mobile, password) VALUES (?, ?, ?)`, [name, mobile, password]);
        res.json({ id: result.lastID, name, mobile, type: 'user' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Register Shopkeeper
const shopUploads = upload.fields([{ name: 'owner_photo', maxCount: 1 }, { name: 'shop_photo', maxCount: 1 }]);
app.post('/api/register/shopkeeper', shopUploads, async (req, res) => {
    const { name, village, city, shop_name, category, mobile, password } = req.body;
    let { latitude, longitude } = req.body;

    // Validate Mobile
    if (!/^\d{10}$/.test(mobile)) return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });

    // Validate & Parse Location
    latitude = parseFloat(latitude);
    longitude = parseFloat(longitude);

    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: 'Invalid or missing GPS location. Please enable location permissions.' });
    }

    try {
        const existing = await dbGet(`SELECT id FROM users WHERE mobile = ? UNION SELECT id FROM shopkeepers WHERE mobile = ?`, [mobile, mobile]);
        if (existing) return res.status(400).json({ error: 'Mobile registered. Please login.' });

        const owner_photo = req.files['owner_photo'] ? '/uploads/' + req.files['owner_photo'][0].filename : null;
        const shop_photo = req.files['shop_photo'] ? '/uploads/' + req.files['shop_photo'][0].filename : null;

        const result = await dbRun(
            `INSERT INTO shopkeepers (name, village, city, shop_name, category, latitude, longitude, owner_photo, shop_photo, mobile, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, village, city, shop_name, category, latitude, longitude, owner_photo, shop_photo, mobile, password]
        );
        cache.shops.expiry = 0; // Invalidate cache
        res.json({ id: result.lastID, shop_name, mobile, type: 'shopkeeper' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { mobile, password } = req.body;
    try {
        const user = await dbGet(`SELECT id, name, mobile, profile_pic FROM users WHERE mobile = ? AND password = ?`, [mobile, password]);
        if (user) return res.json({ ...user, type: 'user' });

        const shop = await dbGet(`SELECT id, name, shop_name, mobile, owner_photo, shop_photo, category, village, city FROM shopkeepers WHERE mobile = ? AND password = ?`, [mobile, password]);
        if (shop) return res.json({ ...shop, type: 'shopkeeper' });

        res.status(401).json({ error: 'Invalid credentials' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Data Routes (Optimized) ---

// --- Smart Search Logic ---
const SYNONYMS = {
    // Vegetables
    "potato": ["alu", "aloo", "batata"],
    "alu": ["potato", "aloo", "batata"],
    "aloo": ["potato", "alu", "batata"],
    "batata": ["potato", "alu", "aloo"],
    "onion": ["pyaz", "kanda", "dungri"],
    "pyaz": ["onion", "kanda"],
    "kanda": ["onion", "pyaz"],
    "tomato": ["tamatar"],
    "tamatar": ["tomato"],
    "chili": ["mirchi", "pepper", "green chili", "hari mirch", "lal mirch"],
    "mirchi": ["chili", "pepper", "green chili", "hari mirch", "lal mirch"],
    "garlic": ["lahsun", "lasun"],
    "lahsun": ["garlic"],
    "ginger": ["adrak"],
    "adrak": ["ginger"],
    "brinjal": ["baingan", "eggplant"],
    "baingan": ["brinjal"],
    "okra": ["bhindi", "ladies finger"],
    "bhindi": ["okra"],
    "cabbage": ["patta gobhi", "gobhi"],
    "cauliflower": ["phool gobhi", "gobhi"],
    "gobhi": ["cabbage", "cauliflower"],
    "spinach": ["palak"],
    "palak": ["spinach"],

    // Fruits
    "apple": ["seb"],
    "seb": ["apple"],
    "banana": ["kela"],
    "kela": ["banana"],
    "mango": ["aam"],
    "aam": ["mango"],
    "grapes": ["angoor"],
    "angoor": ["grapes"],

    // Staples (Grains, Flours, Pulses)
    "rice": ["chawal", "basmati", "paddy"],
    "chawal": ["rice", "basmati"],
    "wheat": ["gehu", "kanak"],
    "gehu": ["wheat"],
    "flour": ["atta", "maida", "besan"],
    "atta": ["flour", "wheat flour"],
    "maida": ["refined flour", "flour"],
    "besan": ["gram flour", "flour"],
    "pulse": ["dal"],
    "dal": ["pulse", "toor", "moong", "urad", "chana", "masoor", "lentil"],
    "lentil": ["dal"],
    "toor": ["arhar", "dal"],
    "chana": ["gram", "chickpeas", "dal"],

    // Spices & Oil & Condiments
    "salt": ["namak"],
    "namak": ["salt"],
    "sugar": ["chini", "shakkar", "jaggery", "gud"],
    "chini": ["sugar"],
    "gud": ["jaggery"],
    "oil": ["tel", "refined", "sarso", "mustard", "sunflower"],
    "tel": ["oil"],
    "turmeric": ["haldi"],
    "haldi": ["turmeric"],
    "cumin": ["jeera"],
    "jeera": ["cumin"],
    "coriander": ["dhania"],
    "dhania": ["coriander"],
    "tea": ["chai", "patti"],
    "chai": ["tea"],

    // Dairy & Others
    "milk": ["doodh", "dairy"],
    "doodh": ["milk"],
    "curd": ["dahi", "yogurt"],
    "dahi": ["curd"],
    "butter": ["makhan"],
    "ghee": ["clarified butter"],
    "paneer": ["cottage cheese"],
    "egg": ["anda"],
    "eggs": ["anda"],
    "anda": ["egg"],
    "bread": ["pav"]
};

// Helper: Expand search term using synonyms
const getRelatedTerms = (term) => {
    const cleanTerm = term.toLowerCase().trim();
    if (!cleanTerm) return [];

    let allTerms = new Set();
    allTerms.add(cleanTerm);

    // 1. Tokenize and expand individual words
    const tokens = cleanTerm.split(/\s+/);
    tokens.forEach(token => {
        allTerms.add(token);
        if (SYNONYMS[token]) {
            SYNONYMS[token].forEach(syn => allTerms.add(syn));
        }
    });

    // 2. Check for multi-word phrases (e.g. "green chili")
    Object.keys(SYNONYMS).forEach(key => {
        if (key.includes(' ') && cleanTerm.includes(key)) {
            SYNONYMS[key].forEach(syn => allTerms.add(syn));
        }
    });

    // 3. Reverse check: if input is "hari mirch", we want "green chili" (if mapped)
    // The dictionary handles this if keys are extensive.

    return [...allTerms];
};

// Get All Products (Filtered & Paginated)
app.get('/api/products', async (req, res) => {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
        let sql = `SELECT p.id, p.shop_id, p.name, p.price, p.image, p.is_best_seller, p.is_special_offer, p.offer_message, p.original_price, 
                          s.shop_name, s.category as shop_category, s.village, s.city, s.latitude, s.longitude 
                   FROM products p
                   JOIN shopkeepers s ON p.shop_id = s.id`;
        const params = [];

        if (search) {
            const terms = getRelatedTerms(search);
            // Construct OR clauses only for valid terms, preventing massive queries
            const validTerms = terms.slice(0, 10); // Limit to top 10 variations for performance

            const likeClauses = validTerms.map(() => `(p.name LIKE ? OR s.shop_name LIKE ? OR s.category LIKE ?)`).join(' OR ');

            sql += ` WHERE (${likeClauses})`;

            validTerms.forEach(t => {
                const wild = `%${t}%`;
                params.push(wild, wild, wild);
            });
        }

        sql += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const rows = await dbAll(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Special Offers (Cached)
app.get('/api/products/offers', async (req, res) => {
    const now = Date.now();
    if (cache.offers.data && cache.offers.expiry > now) {
        return res.json(cache.offers.data);
    }

    try {
        const sql = `SELECT p.id, p.shop_id, p.name, p.price, p.image, p.offer_message, p.original_price, 
                            s.shop_name, s.village, s.city 
                     FROM products p
                     JOIN shopkeepers s ON p.shop_id = s.id
                     WHERE p.is_special_offer = 1
                     ORDER BY p.price ASC LIMIT 50`;
        const rows = await dbAll(sql);

        cache.offers.data = rows;
        cache.offers.expiry = now + CACHE_DURATION;
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get ALL Shopkeepers (Cached & Lightweight)
app.get('/api/shopkeepers', async (req, res) => {
    const now = Date.now();
    if (cache.shops.data && cache.shops.expiry > now) {
        return res.json(cache.shops.data);
    }

    try {
        // Select only what's needed for the dashboard card
        const rows = await dbAll(`SELECT id, shop_name, category, village, city, latitude, longitude, shop_photo, is_open FROM shopkeepers WHERE latitude IS NOT NULL AND longitude IS NOT NULL`);
        cache.shops.data = rows;
        cache.shops.expiry = now + CACHE_DURATION;
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Calculate distance between user and shops (NEW ENDPOINT)
app.post('/api/distance', async (req, res) => {
    const { userLatitude, userLongitude, shopId } = req.body;

    // Validate user location
    const userValidation = validateCoordinates(userLatitude, userLongitude);
    if (!userValidation.isValid) {
        return res.status(400).json({ error: userValidation.error });
    }

    try {
        // Get shop location
        const shop = await dbGet(`SELECT id, shop_name, latitude, longitude FROM shopkeepers WHERE id = ?`, [shopId]);
        
        if (!shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        // Validate shop location
        const shopValidation = validateCoordinates(shop.latitude, shop.longitude);
        if (!shopValidation.isValid) {
            return res.status(400).json({ error: `Shop has invalid location data: ${shopValidation.error}` });
        }

        // Calculate distance using Haversine formula
        const distanceKm = calculateDistance(
            userLatitude, 
            userLongitude, 
            shop.latitude, 
            shop.longitude
        );

        res.json({ 
            shopId: shop.id,
            shopName: shop.shop_name,
            distance: distanceKm,
            formattedDistance: formatDistance(distanceKm)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Calculate distances for multiple shops (BATCH ENDPOINT)
app.post('/api/distances', async (req, res) => {
    const { userLatitude, userLongitude, shopIds } = req.body;

    // Validate user location
    const userValidation = validateCoordinates(userLatitude, userLongitude);
    if (!userValidation.isValid) {
        return res.status(400).json({ error: userValidation.error });
    }

    if (!Array.isArray(shopIds) || shopIds.length === 0) {
        return res.status(400).json({ error: 'shopIds must be a non-empty array' });
    }

    try {
        // Get all shops in one query
        const placeholders = shopIds.map(() => '?').join(',');
        const shops = await dbAll(
            `SELECT id, shop_name, latitude, longitude FROM shopkeepers WHERE id IN (${placeholders})`, 
            shopIds
        );

        // Calculate distances
        const distances = shops.map(shop => {
            // Validate shop location
            const shopValidation = validateCoordinates(shop.latitude, shop.longitude);
            if (!shopValidation.isValid) {
                return {
                    shopId: shop.id,
                    shopName: shop.shop_name,
                    distance: null,
                    formattedDistance: 'Location Error',
                    error: shopValidation.error
                };
            }

            const distanceKm = calculateDistance(
                userLatitude, 
                userLongitude, 
                shop.latitude, 
                shop.longitude
            );

            return {
                shopId: shop.id,
                shopName: shop.shop_name,
                distance: distanceKm,
                formattedDistance: formatDistance(distanceKm)
            };
        });

        res.json({ distances });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Shop Details (Parallel Fetching)
app.get('/api/shops/:id', async (req, res) => {
    const shopId = req.params.id;
    try {
        const [shop, products, reviews] = await Promise.all([
            dbGet(`SELECT * FROM shopkeepers WHERE id = ?`, [shopId]),
            dbAll(`SELECT * FROM products WHERE shop_id = ? ORDER BY is_best_seller DESC, id DESC`, [shopId]),
            dbAll(`SELECT r.id, r.rating, r.comment, r.timestamp, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.shop_id = ? ORDER BY r.timestamp DESC LIMIT 20`, [shopId])
        ]);

        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const totalRatings = reviews.length; // Approximate if we limit, but good enough for UI speed
        const avgRating = totalRatings > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings).toFixed(1) : 0;

        res.json({ ...shop, products, reviews, avgRating, totalRatings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Functional Routes (Updates, Inserts) ---

// Update Shop Profile
app.post('/api/shop/profile', shopUploads, async (req, res) => {
    const { id, name, shop_name, category, opening_time, closing_time, latitude, longitude } = req.body;

    try {
        let sql = `UPDATE shopkeepers SET name = ?, shop_name = ?, category = ?, opening_time = ?, closing_time = ?`;
        const params = [name, shop_name, category, opening_time, closing_time];

        // Update Location if provided
        if (latitude && longitude) {
            sql += `, latitude = ?, longitude = ?`;
            params.push(latitude, longitude);
        }

        // Handle Photos
        if (req.files['owner_photo']) {
            sql += `, owner_photo = ?`;
            params.push('/uploads/' + req.files['owner_photo'][0].filename);
        }
        if (req.files['shop_photo']) {
            sql += `, shop_photo = ?`;
            params.push('/uploads/' + req.files['shop_photo'][0].filename);
        }

        sql += ` WHERE id = ?`;
        params.push(id);

        await dbRun(sql, params);

        cache.shops.expiry = 0; // Invalidate cache

        // Return updated data
        const updated = await dbGet(`SELECT * FROM shopkeepers WHERE id = ?`, [id]);
        res.json({ ...updated, type: 'shopkeeper' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reviews', async (req, res) => {
    const { shop_id, user_id, rating, comment } = req.body;
    try {
        const existing = await dbGet(`SELECT id FROM reviews WHERE shop_id = ? AND user_id = ?`, [shop_id, user_id]);
        if (existing) return res.status(400).json({ error: 'Already reviewed' });

        await dbRun(`INSERT INTO reviews (shop_id, user_id, rating, comment) VALUES (?, ?, ?, ?)`, [shop_id, user_id, rating, comment]);
        res.json({ message: 'Review added' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update Shop Status
app.put('/api/shops/:id/status', async (req, res) => {
    try {
        await dbRun(`UPDATE shopkeepers SET is_open = ? WHERE id = ?`, [req.body.is_open, req.params.id]);
        cache.shops.expiry = 0; // Invalidate cache
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add Product
app.post('/api/products', upload.single('image'), async (req, res) => {
    const { shop_id, name, price, is_best_seller, is_special_offer, offer_message, original_price } = req.body;
    const image = req.file ? '/uploads/' + req.file.filename : null;
    try {
        const result = await dbRun(
            `INSERT INTO products (shop_id, name, price, image, is_best_seller, is_special_offer, offer_message, original_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [shop_id, name, price, image, is_best_seller || 0, is_special_offer || 0, offer_message, original_price]
        );
        if (is_special_offer) cache.offers.expiry = 0;
        res.json({ id: result.lastID, message: 'Added' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update Product
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    const { name, price, is_best_seller, is_special_offer, offer_message, original_price } = req.body;
    let sql = `UPDATE products SET name = ?, price = ?, is_best_seller = ?, is_special_offer = ?, offer_message = ?, original_price = ?`;
    const params = [name, price, is_best_seller || 0, is_special_offer || 0, offer_message, original_price];
    if (req.file) { sql += `, image = ?`; params.push('/uploads/' + req.file.filename); }
    sql += ` WHERE id = ?`; params.push(req.params.id);

    try {
        await dbRun(sql, params);
        if (is_special_offer) cache.offers.expiry = 0;
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await dbRun(`DELETE FROM products WHERE id = ?`, [req.params.id]);
        cache.offers.expiry = 0;
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Chat & Requests (Simplified Async) ---

app.get('/api/shop/chats/:shopId', async (req, res) => {
    try {
        const rows = await dbAll(`
            SELECT DISTINCT u.id, u.name 
            FROM users u
            JOIN messages m ON (m.sender_id = u.id AND m.sender_type = 'user' AND m.receiver_id = ?)
            OR (m.receiver_id = u.id AND m.sender_type = 'shopkeeper' AND m.sender_id = ?)
            WHERE m.hidden_for_shopkeeper = 0
        `, [req.params.shopId, req.params.shopId]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/messages', async (req, res) => {
    const { user_id, shop_id } = req.query;
    try {
        const rows = await dbAll(
            `SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY timestamp ASC`,
            [user_id, shop_id, shop_id, user_id]
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/messages', async (req, res) => {
    const { sender_type, sender_id, receiver_id, content } = req.body;
    try {
        const result = await dbRun(
            `INSERT INTO messages (sender_type, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)`,
            [sender_type, sender_id, receiver_id, content]
        );
        res.json({ id: result.lastID, sender_type, timestamp: new Date() });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Request Routes...
app.post('/api/requests', async (req, res) => {
    const { user_id, product_name, latitude, longitude } = req.body;
    try {
        const result = await dbRun(`INSERT INTO product_requests (user_id, product_name, latitude, longitude) VALUES (?, ?, ?, ?)`, [user_id, product_name, latitude, longitude]);
        res.json({ id: result.lastID, message: 'Sent' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/shop/requests', async (req, res) => {
    if (!req.query.shop_id) return res.status(400).json({ error: 'shop_id required' });
    try {
        const rows = await dbAll(`
            SELECT product_requests.*, users.name as user_name 
            FROM product_requests 
            JOIN users ON product_requests.user_id = users.id 
            WHERE status = 'pending' 
            AND product_requests.timestamp > datetime('now', '-2 hours')
            AND product_requests.id NOT IN (SELECT request_id FROM request_responses WHERE shop_id = ?)
            ORDER BY timestamp DESC
        `, [req.query.shop_id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/requests/:id/respond', upload.single('image'), async (req, res) => {
    const { shop_id, product_name, price, note, response_type } = req.body;
    const image = req.file ? '/uploads/' + req.file.filename : null;
    try {
        await dbRun(
            `INSERT INTO request_responses (request_id, shop_id, product_name, price, image, note) VALUES (?, ?, ?, ?, ?, ?)`,
            [req.params.id, shop_id, response_type === 'no' ? 'NO' : product_name, price || 0, image, note]
        );
        res.json({ message: 'Responded' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/user/responses', async (req, res) => {
    try {
        const rows = await dbAll(`
            SELECT rr.*, s.shop_name, s.village, s.city, s.latitude, s.longitude, s.owner_photo
            FROM request_responses rr
            JOIN product_requests pr ON rr.request_id = pr.id
            JOIN shopkeepers s ON rr.shop_id = s.id
            WHERE pr.user_id = ? AND rr.is_archived = 0
            ORDER BY rr.timestamp DESC
        `, [req.query.user_id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/responses/:id/archive', async (req, res) => {
    try {
        await dbRun(`UPDATE request_responses SET is_archived = ? WHERE id = ?`, [req.body.is_archived, req.params.id]);
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
