const express = require('express');
const router = express.Router();

const { isAuthenticated } = require('../middlewares/auth');
const perfilController = require('../controllers/perfilController');

router.use(isAuthenticated);

router.get('/alterar-senha', perfilController.alterarSenhaForm);
router.post('/alterar-senha', perfilController.alterarSenhaSalvar);

module.exports = router;
