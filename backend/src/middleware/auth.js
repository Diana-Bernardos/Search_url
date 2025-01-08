// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Token no proporcionado'
            });
        }

        const token = authHeader.split(' ')[1];
        
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.error('Error de verificación de token:', err);
                return res.status(403).json({
                    success: false,
                    error: 'Token inválido'
                });
            }

            req.user = user;
            console.log('Usuario autenticado:', user);
            next();
        });
    } catch (error) {
        console.error('Error en autenticación:', error);
        res.status(500).json({
            success: false,
            error: 'Error en autenticación'
        });
    }
};

module.exports = { authenticateToken };