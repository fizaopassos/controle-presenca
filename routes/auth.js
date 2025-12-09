const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Tela de login
router.get('/login', authController.showLogin);

// Envio do formulário de login
router.post('/login', authController.login);

// Logout
router.get('/logout', authController.logout);

module.exports = router;