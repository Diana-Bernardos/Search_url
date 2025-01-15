// src/config/config.js
require('dotenv').config();

const config = {
    // Servidor
    server: {
        port: process.env.PORT || 3001,
        nodeEnv: process.env.NODE_ENV || 'development',
        apiPrefix: process.env.API_PREFIX || '/api'
    },

    // Base de datos
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'scraper_db',
        port: parseInt(process.env.DB_PORT) || 3306,
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
        queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
        acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000,
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
        minConnections: parseInt(process.env.DB_MIN_CONNECTIONS) || 0
    },

    // JWT y Seguridad
    security: {
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiration: process.env.JWT_EXPIRATION || '24h',
        bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
        }
    },

    // CORS
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(',') || ['Content-Type', 'Authorization']
    },

    // Timeouts y Límites
    limits: {
        scraperTimeout: parseInt(process.env.SCRAPER_TIMEOUT) || 30000,
        bodyLimit: process.env.REQUEST_BODY_LIMIT || '50mb',
        parameterLimit: parseInt(process.env.REQUEST_PARAMETER_LIMIT) || 5000
    },

    // Logger
    logger: {
        level: process.env.LOG_LEVEL || 'debug',
        format: process.env.LOG_FORMAT || 'dev'
    },

    // Cache
    cache: {
        ttl: parseInt(process.env.CACHE_TTL) || 3600,
        maxItems: parseInt(process.env.MAX_CACHE_ITEMS) || 1000
    },

    // Scraper
    scraper: {
        userAgent: process.env.SCRAPER_USER_AGENT || 'Mozilla/5.0 (compatible; ScraperBot/1.0;)',
        maxRedirects: parseInt(process.env.SCRAPER_MAX_REDIRECTS) || 5,
        followRedirects: process.env.SCRAPER_FOLLOW_REDIRECTS === 'true',
        maxResponseSize: parseInt(process.env.SCRAPER_MAX_RESPONSE_SIZE) || 5242880
    }
};

// Validación básica de configuración crítica
const requiredEnvVars = ['JWT_SECRET', 'DB_PASSWORD'];
requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        throw new Error(`Variable de entorno requerida ${envVar} no está definida`);
    }
});

module.exports = config;