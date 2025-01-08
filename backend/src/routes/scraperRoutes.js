// src/routes/scraperRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    scrapeUrl, 
    getScrapingHistory, 
    deleteProperty 
} = require('../controllers/scraperController');

// Rutas del scraper
router.post('/scrape', authenticateToken, (req, res, next) => {
    console.log('Recibida petición de scraping:', req.body);
    scrapeUrl(req, res, next);
});
          // POST /api/scraper/scrape
router.get('/history', authenticateToken, getScrapingHistory);  // GET /api/scraper/history
router.delete('/property/:propertyId', authenticateToken, deleteProperty); // DELETE /api/scraper/property/:id

module.exports = router;