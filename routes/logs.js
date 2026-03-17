const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logsController');

router.get('/', logsController.listar);
router.get('/:id', logsController.detalhe);

module.exports = router;