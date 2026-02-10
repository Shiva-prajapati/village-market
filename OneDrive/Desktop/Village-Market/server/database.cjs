const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'village_market.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Enable WAL mode for better concurrency
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA synchronous = NORMAL;');
    db.run('PRAGMA cache_size = 10000;'); // Keep more pages in memory
    db.run('PRAGMA foreign_keys = ON;');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mobile TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      profile_pic TEXT
    )`);

    // Shopkeepers Table
    db.run(`CREATE TABLE IF NOT EXISTS shopkeepers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mobile TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      village TEXT,
      city TEXT,
      shop_name TEXT,
      category TEXT,
      latitude REAL,
      longitude REAL,
      owner_photo TEXT,
      shop_photo TEXT,
      is_open INTEGER DEFAULT 1,
      opening_time TEXT,
      closing_time TEXT
    )`);

    // Products Table
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT,
      in_stock INTEGER DEFAULT 1,
      is_best_seller INTEGER DEFAULT 0,
      is_special_offer INTEGER DEFAULT 0,
      offer_message TEXT,
      original_price REAL,
      FOREIGN KEY (shop_id) REFERENCES shopkeepers (id)
    )`);

    // Messages Table
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_type TEXT NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      hidden_for_shopkeeper INTEGER DEFAULT 0,
      hidden_for_user INTEGER DEFAULT 0
    )`);

    // Reviews Table
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shop_id) REFERENCES shopkeepers (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Product Requests Table
    db.run(`CREATE TABLE IF NOT EXISTS product_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      status TEXT DEFAULT 'pending',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Request Responses Table
    db.run(`CREATE TABLE IF NOT EXISTS request_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      shop_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT,
      note TEXT,
      is_archived INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES product_requests (id),
      FOREIGN KEY (shop_id) REFERENCES shopkeepers (id)
    )`);

    // --- Performance Indexes ---
    // Products (Critical for search and filtering)
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_search ON products(name)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_offers ON products(is_special_offer)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_shop_sort ON products(shop_id, is_best_seller DESC, id DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_best_seller ON products(is_best_seller)`);

    // Messages (For chat performance)
    db.run(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, sender_type)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, sender_type)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC)`);

    // Reviews (For ratings and reviews)
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_shop ON reviews(shop_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(shop_id, rating)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_timestamp ON reviews(timestamp DESC)`);

    // Shopkeepers (For location and discovery)
    db.run(`CREATE INDEX IF NOT EXISTS idx_shops_mobile ON shopkeepers(mobile)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_shops_city ON shopkeepers(city)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_shops_category ON shopkeepers(category)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_shops_search ON shopkeepers(shop_name, category)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_shops_location ON shopkeepers(latitude, longitude)`); // For distance queries
    db.run(`CREATE INDEX IF NOT EXISTS idx_shops_open_status ON shopkeepers(is_open)`);

    // Product Requests (For request handling)
    db.run(`CREATE INDEX IF NOT EXISTS idx_requests_user ON product_requests(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_requests_status ON product_requests(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_requests_timestamp ON product_requests(timestamp DESC)`);

    // Request Responses (For response queries)
    db.run(`CREATE INDEX IF NOT EXISTS idx_responses_request ON request_responses(request_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_responses_shop ON request_responses(shop_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_responses_archived ON request_responses(is_archived)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_responses_timestamp ON request_responses(timestamp DESC)`);

    // Users (For authentication and lookups)
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile)`);
  });
}

module.exports = db;
