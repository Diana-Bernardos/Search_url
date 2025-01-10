// src/routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { 
    authenticateToken, 
    validateRegisterRequest, 
    validateLoginRequest 
} = require('../middleware/auth');
const { register, login } = require('../controllers/authController');
router.get('/validate-token', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});
// Rutas de autenticación
router.post('/register', register);
router.post('/login', login);

module.exports = router;
