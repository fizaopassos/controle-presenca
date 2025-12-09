const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const colaboradoresController = require('../controllers/colaboradoresController');

// Listar colaboradores
router.get('/', isAuthenticated, colaboradoresController.listar);

// Formulário de novo colaborador
router.get('/novo', isAuthenticated, colaboradoresController.formNovo);

// Salvar novo colaborador
router.post('/novo', isAuthenticated, colaboradoresController.criar);

// Formulário de edição
router.get('/editar/:id', isAuthenticated, colaboradoresController.formEditar);

// Atualizar colaborador
router.post('/editar/:id', isAuthenticated, colaboradoresController.atualizar);

// Ativar / Inativar (toggle)
router.post('/toggle-ativo/:id', isAuthenticated, colaboradoresController.toggleAtivo);

module.exports = router;
