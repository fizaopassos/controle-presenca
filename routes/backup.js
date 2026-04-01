const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { isAuthenticated } = require('../middlewares/auth');

router.get('/', isAuthenticated, backupController.index);
router.get('/gerar', isAuthenticated, backupController.gerar);

module.exports = router;
