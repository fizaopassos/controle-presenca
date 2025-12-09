const express = require('express');
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

module.exports = router;
