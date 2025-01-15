const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { 
    authenticateToken, 
    validateRegisterRequest, 
    validateLoginRequest 
} = require('../middleware/auth');
const { register, login } = require('../controllers/authController');

// Middleware de logging para rutas de autenticación
router.use((req, res, next) => {
    console.group('Ruta de Autenticación');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Método: ${req.method}`);
    console.log(`Ruta: ${req.path}`);
    console.log('Cabeceras:', req.headers);
    
    if (req.method === 'POST') {
        // Evitar loguear contraseñas
        const safeBody = {...req.body};
        if (safeBody.password) {
            safeBody.password = '***OCULTO***';
        }
        console.log('Cuerpo de la solicitud:', safeBody);
    }
    
    console.groupEnd();
    next();
});

router.get('/validate-token', authenticateToken, (req, res) => {
    console.group('Validación de Token');
    console.log('Usuario autenticado:', req.user);
    console.groupEnd();

    res.json({
        valid: true,
        user: req.user
    });
});

// Rutas de autenticación con logging
router.post('/register', (req, res, next) => {
    console.group('Registro de Usuario');
    console.log('Datos de registro:', {
        username: req.body.username,
        email: req.body.email
    });
    console.groupEnd();
    register(req, res, next);
});

router.post('/login', (req, res, next) => {
    console.group('Login de Usuario');
    console.log('Intento de login:', {
        email: req.body.email
    });
    console.groupEnd();
    login(req, res, next);
});

module.exports = router;
