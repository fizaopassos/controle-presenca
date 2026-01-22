// routes/postos.js
const express = require('express');
const router = express.Router();

const { isAuthenticated, allowPerfis } = require('../middlewares/auth');
const postosController = require('../controllers/postosController');

// Todas as rotas de postos: usuário logado e perfil admin ou gestor
router.use(isAuthenticated, allowPerfis(['admin', 'gestor']));

// Listar postos
router.get('/', postosController.listar);

// Formulário de novo posto
router.get('/novo', postosController.formNovo);

// Salvar novo posto
router.post('/novo', postosController.criar);

// Formulário de edição
router.get('/editar/:id', postosController.formEditar);

// Atualizar posto
router.post('/editar/:id', postosController.atualizar);

// Ativar / Inativar (toggle)
router.post('/toggle-ativo/:id', postosController.toggleAtivo);

module.exports = router;

