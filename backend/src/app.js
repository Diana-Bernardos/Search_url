// src/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mysql = require('mysql2/promise');

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    
    // Log del cuerpo de la solicitud para solicitudes POST
    if (req.method === 'POST') {
        console.log('Cuerpo de la solicitud:', req.body);
    }
    
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Rutas
const authRoutes = require('./routes/authRoutes');
const scraperRoutes = require('./routes/scraperRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/scraper', scraperRoutes);

// Error 404
app.use((req, res) => {
    console.log('Ruta no encontrada:', req.originalUrl);
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.originalUrl 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error global detectado:', err);
    
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 3001;

const startServer = async () => {
    try {
        // Iniciar el servidor
        app.listen(PORT, () => {
            console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
            console.log(`✅ API disponible en http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();