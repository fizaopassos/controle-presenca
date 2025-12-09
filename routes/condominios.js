const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const condominiosController = require('../controllers/condominiosController');

// Listar condomínios
router.get('/', isAuthenticated, condominiosController.listar);

// Formulário de novo condomínio
router.get('/novo', isAuthenticated, condominiosController.formNovo);

// Salvar novo condomínio
router.post('/novo', isAuthenticated, condominiosController.criar);

// Formulário de edição
router.get('/editar/:id', isAuthenticated, condominiosController.formEditar);

// Atualizar condomínio
router.post('/editar/:id', isAuthenticated, condominiosController.atualizar);

// Ativar / Inativar (toggle)
router.post('/toggle-ativo/:id', isAuthenticated, condominiosController.toggleAtivo);

module.exports = router;
