const express = require('express');
const router = express.Router();

const { isAuthenticated, isAdmin } = require('../middlewares/auth');
const empresasController = require('../controllers/empresasController');

// ✅ CORRIGIDO: apenas ADMIN gerencia empresas
router.use(isAuthenticated, isAdmin);

router.get('/', empresasController.listar);
router.get('/novo', empresasController.formNovo);
router.post('/novo', empresasController.criar);
router.get('/editar/:id', empresasController.formEditar);
router.post('/editar/:id', empresasController.atualizar);
router.get('/toggle/:id', empresasController.toggleAtivo);

module.exports = router;
