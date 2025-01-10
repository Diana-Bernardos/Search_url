// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'No se proporcionó token de autenticación'
        });
    }

    try {
        const decoded = jwt.verify(token, config.security.jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Error de autenticación:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({
                error: 'Token expirado',
                expired: true
            });
        }
        
        return res.status(403).json({
            error: 'Token inválido o expirado.'
        });
    }
};

module.exports = {
    authenticateToken
};