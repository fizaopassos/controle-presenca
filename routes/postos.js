const express = require('express');
const router = express.Router();

const { isAuthenticated, isAdmin } = require('../middlewares/auth');
const postosController = require('../controllers/postosController');

// ✅ CORRIGIDO: apenas ADMIN gerencia postos
router.use(isAuthenticated, isAdmin);

router.get('/', postosController.listar);
router.get('/novo', postosController.formNovo);
router.post('/novo', postosController.criar);
router.get('/editar/:id', postosController.formEditar);
router.post('/editar/:id', postosController.atualizar);
router.post('/toggle-ativo/:id', postosController.toggleAtivo);

module.exports = router;
