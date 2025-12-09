const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const postosController = require('../controllers/postosController');

// Listar postos
router.get('/', isAuthenticated, postosController.listar);

// Formulário de novo posto
router.get('/novo', isAuthenticated, postosController.formNovo);

// Salvar novo posto
router.post('/novo', isAuthenticated, postosController.criar);

// Formulário de edição
router.get('/editar/:id', isAuthenticated, postosController.formEditar);

// Atualizar posto
router.post('/editar/:id', isAuthenticated, postosController.atualizar);

// Ativar / Inativar (toggle)
router.post('/toggle-ativo/:id', isAuthenticated, postosController.toggleAtivo);

module.exports = router;
