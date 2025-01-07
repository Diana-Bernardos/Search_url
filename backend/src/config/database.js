// src/config/database.js
// src/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Dianaleire-1',
    database: process.env.DB_NAME || 'scraper_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
pool.getConnection()
    .then(connection => {
        console.log('Database connection established successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err);
    });

module.exports = pool;