const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'server/village_market.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Fetching data...");

    db.all("SELECT * FROM users", (err, rows) => {
        if (err) {
            console.error("Error fetching users:", err);
            return;
        }
        console.log("--- ALL USERS ---");
        console.log(JSON.stringify(rows, null, 2));

        db.all("SELECT * FROM shopkeepers", (err, rows) => {
            if (err) {
                console.error("Error fetching shopkeepers:", err);
                return;
            }
            console.log("\n--- ALL SHOPKEEPERS ---");
            console.log(JSON.stringify(rows, null, 2));
            db.close();
        });
    });
});
