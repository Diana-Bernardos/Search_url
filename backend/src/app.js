// app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware de CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.use((req, res, next) => {
    console.log('Request:', {
        method: req.method,
        path: req.path,
        body: req.body,
        headers: req.headers
    });
    next();
});

// Rutas
try {
    const authRoutes = require('./routes/authRoutes');
    const scraperRoutes = require('./routes/scraperRoutes');

    app.use('/api/auth', authRoutes);
    app.use('/api/scraper', scraperRoutes);

    console.log("✓ Rutas montadas:");
    console.log("  - /api/auth");
    console.log("  - /api/scraper");
} catch (error) {
    console.error('Error al cargar rutas:', error);
    process.exit(1);
}

// 404 handler
app.use((req, res) => {
    console.log("404:", req.originalUrl);
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor'
    });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
    server.close(() => process.exit(0));
});