// routes/empresas.js
const express = require('express');
const router = express.Router();

const { isAuthenticated, allowPerfis } = require('../middlewares/auth');
const empresasController = require('../controllers/empresasController');

// Todas as rotas de empresas: usuário logado e perfil admin ou gestor
router.use(isAuthenticated, allowPerfis(['admin', 'gestor']));

// Listagem  -> GET /empresas
router.get('/', empresasController.listar);

// Novo      -> GET /empresas/novo  | POST /empresas/novo
router.get('/novo', empresasController.formNovo);
router.post('/novo', empresasController.criar);

// Editar    -> GET /empresas/editar/:id  | POST /empresas/editar/:id
router.get('/editar/:id', empresasController.formEditar);
router.post('/editar/:id', empresasController.atualizar);

// Toggle ativo -> GET /empresas/toggle/:id
router.get('/toggle/:id', empresasController.toggleAtivo);

module.exports = router;


