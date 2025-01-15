const jwt = require('jsonwebtoken'); // Añade esta línea al principio del archivo

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Token recibido en middleware:', token); // Log adicional para depuración

    if (!token) {
        return res.status(401).json({
            error: 'No se proporcionó token de autenticación'
        });
    }

    try {
        // Verificar que JWT_SECRET esté definido
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET no está definido en las variables de entorno');
            return res.status(500).json({
                error: 'Error de configuración del servidor'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Error de autenticación:', err);

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado'
            });
        }

        if (err.name === 'JsonWebTokenError') {
            return res.status(403).json({
                error: 'Token inválido'
            });
        }

        // Manejamos cualquier otro error de autenticación
        return res.status(500).json({
            error: 'Error en la autenticación',
            details: err.message
        });
    }
};

module.exports = {
    authenticateToken
};