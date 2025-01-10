const express = require('express');
const cors = require('cors');
require('dotenv').config();
const config = require('./config/config');

const app = express();

// Middleware de seguridad y configuración básica
app.use(cors(config.cors));
app.use(express.json({ limit: config.limits.bodyLimit }));
app.use(express.urlencoded({ 
    extended: true,
    limit: config.limits.bodyLimit 
}));

// Logger middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const { method, path, ip } = req;
    console.log(`[${timestamp}] ${method} ${path} - IP: ${ip}`);
    
    // Agregar X-Request-ID para tracking
    req.requestId = Math.random().toString(36).substring(7);
    res.setHeader('X-Request-ID', req.requestId);
    
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Cargar y montar rutas
let authRoutes;
let scraperRoutes;

try {
    authRoutes = require('./routes/authRoutes');
    scraperRoutes = require('./routes/scraperRoutes');

    // Montar rutas con prefijo de API
    app.use(`${config.server.apiPrefix}/auth`, authRoutes);
    app.use(`${config.server.apiPrefix}/scraper`, scraperRoutes);

    console.log(`✅ Rutas de autenticación montadas en ${config.server.apiPrefix}/auth`);
    console.log(`✅ Rutas de scraper montadas en ${config.server.apiPrefix}/scraper`);
} catch (error) {
    console.error('❌ Error al cargar rutas:', error);
    process.exit(1);
}

// Manejador de ruta 404
app.use((req, res) => {
    console.log(`❌ Ruta no encontrada: ${req.originalUrl}`);
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
    });
});

// Manejador de errores centralizado
app.use((err, req, res, next) => {
    console.error('❌ Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        requestId: req.requestId,
        path: req.path,
        method: req.method
    });

    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        // Solo incluir detalles adicionales en desarrollo
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Inicialización del servidor
const PORT = config.server.port;
let server;

const startServer = async () => {
    try {
        server = app.listen(PORT, () => {
            console.log(`✨ Servidor corriendo en http://localhost:${PORT}`);
            console.log(`🚀 API disponible en ${config.server.apiPrefix}`);
            console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
        });

        // Configurar timeouts del servidor
        server.timeout = config.limits.scraperTimeout;
        server.keepAliveTimeout = 65000;
        server.headersTimeout = 66000;

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Función para cierre graceful
const shutdownGracefully = (signal) => {
    console.log(`\n📡 Recibida señal ${signal}. Iniciando cierre graceful...`);
    if (server) {
        server.close(() => {
            console.log('✅ Servidor cerrado correctamente.');
            process.exit(0);
        });

        // Forzar cierre después de 10 segundos
        setTimeout(() => {
            console.log('❌ Forzando cierre después de timeout');
            process.exit(1);
        }, 10000);
    } else {
        process.exit(0);
    }
};

// Manejo de señales de terminación
process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
process.on('SIGINT', () => shutdownGracefully('SIGINT'));

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    shutdownGracefully('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    shutdownGracefully('UNHANDLED_REJECTION');
});

// Iniciar el servidor
startServer();