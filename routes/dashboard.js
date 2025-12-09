const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const dashboardController = require('../controllers/dashboardController');

// Dashboard principal
router.get('/dashboard', isAuthenticated, dashboardController.show);

// Redirecionar / para /dashboard se logado, ou /auth/login se não
router.get('/', (req, res) => {
if (req.session && req.session.user) {
return res.redirect('/dashboard');
}
return res.redirect('/auth/login');
});

module.exports = router;