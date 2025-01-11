const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const ERROR_MESSAGES = {
        NO_TOKEN: 'No se proporcionó token de autenticación',
        INVALID_TOKEN: 'Token inválido',
        EXPIRED_TOKEN: 'Token expirado',
        AUTH_ERROR: 'Error en la autenticación'
    };

    try {
        const authHeader = req.headers['authorization'];

        // Validar si el encabezado de autorización está presente y tiene el formato correcto
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: ERROR_MESSAGES.NO_TOKEN
            });
        }

        const token = authHeader.split(' ')[1];

        // Verificar el token
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        error: ERROR_MESSAGES.EXPIRED_TOKEN
                    });
                }

                return res.status(403).json({
                    error: ERROR_MESSAGES.INVALID_TOKEN
                });
            }

            // Si el token es válido, añadir el usuario al objeto de la solicitud
            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error('Error en autenticación:', error);
        return res.status(500).json({
            error: ERROR_MESSAGES.AUTH_ERROR
        });
    }
};

module.exports = {
    authenticateToken
};
