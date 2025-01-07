const express = require('express');
const cors = require('cors');
require('dotenv').config();


const app = express();

// Middleware (CORS - SOLO UNO)
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'] // No necesitas cabeceras personalizadas aquí a menos que las uses en el frontend
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requests (opcional, pero útil para depuración)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Ruta de health check (siempre disponible - ANTES de las otras rutas)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Importar y usar las rutas de autenticación y scraper (SIEMPRE - ANTES del manejo de errores 404)
try {
    const authRoutes = require('./routes/authRoutes');
    const scraperRoutes = require('./routes/scraperRoutes');

    app.use('/api/auth', authRoutes);
    app.use('/api/scraper', scraperRoutes);

    console.log("Rutas de autenticación montadas en /api/auth");
    console.log("Rutas de scraper montadas en /api/scraper");

} catch (error) {
    console.error('Error al cargar rutas:', error);
    process.exit(1); // Salir con código de error si las rutas no se cargan
}
// RUTA DE PRUEBA DEFINIDA DIRECTAMENTE EN app.js
app.post('/api/scraper', (req, res) => {
    console.log("¡RUTA /api/scraper FUNCIONANDO!"); // Comprobación crucial
    console.log("Cuerpo de la petición:", req.body); // Imprime el cuerpo de la petición
    res.json({ message: 'Ruta de prueba /api/scraper funcionando', properties: [{ id: 1, name: "test" }]});
});
// Manejador de ruta 404 (DESPUÉS de definir TODAS las rutas)
app.use((req, res) => {
    console.log("Ruta no encontrada:", req.originalUrl); // Log para depuración
    res.status(404).json({ error: 'Ruta no encontrada', path: req.originalUrl });
});

// Manejador de errores centralizado (DESPUÉS del 404)
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(err.status || 500).json({ error: err.message || 'Algo salió mal!' });
});


const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`El puerto ${PORT} está en uso. Intenta con otro puerto.`);
    } else {
        console.error('Error al iniciar el servidor:', error);
    }
    process.exit(1);
});

// Manejo de señales de terminación (para un cierre limpio)
process.on('SIGTERM', () => {
    console.log('Recibida señal de terminación (SIGTERM). Cerrando el servidor...');
    server.close(() => {
        console.log('Servidor cerrado.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Recibida señal de interrupción (SIGINT). Cerrando el servidor...');
    server.close(() => {
        console.log('Servidor cerrado.');
        process.exit(0);
    });
});