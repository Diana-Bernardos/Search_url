// src/routes/scraperRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    scrapeUrl,
    getScrapingHistory,
    deleteProperty
} = require('../controllers/scraperController');  // Importación correcta

// Rutas
router.post('/scraper', authenticateToken, scrapeUrl);
router.get('/history', authenticateToken, getScrapingHistory);
router.delete('/property/:propertyId', authenticateToken, deleteProperty);

module.exports = router;
