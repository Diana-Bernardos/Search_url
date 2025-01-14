// src/routes/scraperRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    scrapeUrl, 
    getScrapingHistory, 
    deleteProperty ,
    preAnalyzeUrl
} = require('../controllers/scraperController');

// Log middleware
router.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.method === 'POST') {
        console.log('Body:', req.body);
    }
    next();
});

// Rutas principales
router.post('/', authenticateToken, scrapeUrl);
router.get('/history', authenticateToken, getScrapingHistory);
router.delete('/property/:propertyId', authenticateToken, deleteProperty);
router.post('/pre-analyze', authenticateToken, preAnalyzeUrl);

// Manejo de errores específico para las rutas del scraper
router.use((error, req, res, next) => {
    console.error('Error en ruta del scraper:', error);
    res.status(500).json({
        error: 'Error en el servidor',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined

    });
});

module.exports = router;