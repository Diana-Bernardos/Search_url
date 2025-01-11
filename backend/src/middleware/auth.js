// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: 'No se proporcionó token de autenticación'
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        error: 'Token expirado'
                    });
                }
                return res.status(403).json({
                    error: 'Token inválido'
                });
            }

            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error('Error en autenticación:', error);
        res.status(500).json({
            error: 'Error en la autenticación'
        });
    }
};

module.exports = {
    authenticateToken
};