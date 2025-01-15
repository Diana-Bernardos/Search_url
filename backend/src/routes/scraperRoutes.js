const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    scrapeUrl, 
    getScrapingHistory, 
    deleteProperty,
    preAnalyzeUrl
} = require('../controllers/scraperController');

// Log middleware mejorado
router.use((req, res, next) => {
    console.group('Solicitud de Scraper');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Método: ${req.method}`);
    console.log(`Ruta: ${req.path}`);
    console.log('Cabeceras:', req.headers);
    
    if (req.method === 'POST') {
        console.log('Cuerpo de la solicitud:', req.body);
    }
    
    // Log de token de autorización
    const authHeader = req.headers['authorization'];
    console.log('Cabecera de autorización:', authHeader);
    
    console.groupEnd();
    next();
});

// Rutas principales con logs adicionales
router.post('/', authenticateToken, (req, res, next) => {
    // Aumenta el timeout para esta ruta específica
    req.setTimeout(300000); // 5 minutos
    console.group('Ruta de Scraping');
    console.log('Datos recibidos:', req.body);
    console.log('Usuario autenticado:', req.user);
    console.groupEnd();
    scrapeUrl(req, res, next);
});

router.get('/history', authenticateToken, getScrapingHistory);
router.delete('/property/:propertyId', authenticateToken, deleteProperty);
router.post('/pre-analyze', authenticateToken, (req, res, next) => {
    console.group('Ruta de Pre-Análisis');
    console.log('Datos recibidos:', req.body);
    console.log('Usuario autenticado:', req.user);
    console.groupEnd();
    preAnalyzeUrl(req, res, next);
});

// Manejo de errores específico para las rutas del scraper
router.use((error, req, res, next) => {
    console.group('Error en Ruta de Scraper');
    console.error('Detalles del error:', {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        request: {
            method: req.method,
            path: req.path,
            body: req.body,
            headers: req.headers
        }
    });
    console.groupEnd();

    res.status(500).json({
        error: 'Error en el servidor',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
});

module.exports = router;