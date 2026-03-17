const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const dashboardController = require('../controllers/dashboardController');

router.get('/', isAuthenticated, dashboardController.show);
router.get('/api/resumo', isAuthenticated, dashboardController.resumo);

module.exports = router;
