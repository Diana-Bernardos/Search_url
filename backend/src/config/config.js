// src/config/config.js
require('dotenv').config();

const config = {
    // Servidor
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Base de datos
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'scraper_db',
        connectionLimit: 10
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '24h'
    },

    // Cors
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },

    // Scraper
    scraper: {
        timeout: parseInt(process.env.SCRAPER_TIMEOUT) || 30000,
        userAgent: 'Mozilla/5.0 (compatible; ScraperBot/1.0;)',
        maxRedirects: 5
    }
};

module.exports = config;