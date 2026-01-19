/*const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const empresasController = require('../controllers/empresasController');

// Listar empresas
router.get('/', isAuthenticated, empresasController.listar);

// Formulário de nova empresa
router.get('/novo', isAuthenticated, empresasController.formNovo);

// Salvar nova empresa
router.post('/novo', isAuthenticated, empresasController.criar);

// Formulário de edição
router.get('/editar/:id', isAuthenticated, empresasController.formEditar);

// Atualizar empresa
router.post('/editar/:id', isAuthenticated, empresasController.atualizar);

// Ativar / Inativar (toggle)
router.post('/toggle-ativo/:id', isAuthenticated, empresasController.toggleAtivo);

module.exports = router;*/

const express = require('express');
const router = express.Router();
const empresasController = require('../controllers/empresasController');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

// Se só ADMIN pode mexer em empresas, use os dois middlewares
// Se qualquer usuário autenticado pode ver/mexer, use só isAuthenticated

// Listagem  -> GET /empresas
router.get('/', isAuthenticated, empresasController.listar);

// Novo      -> GET /empresas/novo  | POST /empresas/novo
router.get('/novo', isAuthenticated, isAdmin, empresasController.formNovo);
router.post('/novo', isAuthenticated, isAdmin, empresasController.criar);

// Editar    -> GET /empresas/editar/:id  | POST /empresas/editar/:id
router.get('/editar/:id', isAuthenticated, isAdmin, empresasController.formEditar);
router.post('/editar/:id', isAuthenticated, isAdmin, empresasController.atualizar);

// Toggle ativo -> GET /empresas/toggle/:id
router.get('/toggle/:id', isAuthenticated, isAdmin, empresasController.toggleAtivo);

module.exports = router;

