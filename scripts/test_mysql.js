const { PrismaClient } = require('@prisma/client');

// We'll try to guess the database name or just test the connection string
// Based on typical cPanel setups, the DB name might be the same as the user or have a prefix
const credentials = {
    host: 'vivantara.com',
    user: 'aumlan',
    pass: 'shikhaghosh003',
    // Try common DB names
    dbNames: ['aumlan', 'aumlan_db', 'aumlan_vivartana']
};

async function testConnection() {
    console.log(`Testing connection to ${credentials.host} as ${credentials.user}...`);
    
    // We can't easily list databases without a direct driver, 
    // but we can try common ones with Prisma or use a basic mysql2 test if installed.
    // Let's try to see if mysql2 is available in node_modules
    try {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: credentials.host,
            user: credentials.user,
            password: credentials.pass,
        });
        console.log("SUCCESS: Connected to MySQL server!");
        const [rows] = await connection.query("SHOW DATABASES");
        console.log("Available Databases:");
        console.log(rows.map(r => r.Database));
        await connection.end();
    } catch (err) {
        console.error("FAILED to connect to MySQL:");
        console.error(err.message);
    }
}

testConnection();
