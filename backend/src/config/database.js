// src/config/database.js
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'scraper_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convertir pool a promesas
const promisePool = pool.promise();

// Test de conexión
promisePool.query('SELECT 1')
    .then(() => console.log('✅ Conexión a base de datos establecida'))
    .catch(err => {
        console.error('❌ Error conectando a la base de datos:', err);
        process.exit(1);
    });

module.exports = promisePool;