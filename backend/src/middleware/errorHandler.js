// src/middleware/errorHandler.js
const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error(err);

    // Errores de base de datos
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
            error: 'Ya existe un registro con esos datos'
        });
    }

    // Errores de validación
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: err.message
        });
    }

    // Errores de autenticación
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Token inválido'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expirado'
        });
    }

    // Error por defecto
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor'
    });
};