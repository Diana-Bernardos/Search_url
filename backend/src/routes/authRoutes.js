// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { 
    authenticateToken, 
    validateRegisterRequest, 
    validateLoginRequest 
} = require('../middleware/auth');
const { register, login } = require('../controllers/authController');

// Rutas de autenticación
router.post('/register', register);
router.post('/login', login);

module.exports = router;
