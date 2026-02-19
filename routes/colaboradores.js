const express = require('express');
const router = express.Router();

const { isAuthenticated, allowPerfis } = require('../middlewares/auth');
const colaboradoresController = require('../controllers/colaboradoresController');

// Todas as rotas de colaboradores: usuário logado e perfil admin/gestor/lancador
router.use(isAuthenticated, allowPerfis(['admin', 'gestor', 'lancador']));

// Listar colaboradores
router.get('/', colaboradoresController.listar);

// Formulário de novo colaborador
router.get('/novo', colaboradoresController.formNovo);

router.post('/inativar-com-data/:id', colaboradoresController.inativarComData);

// Salvar novo colaborador
router.post('/novo', colaboradoresController.criar);

// Listar coberturas (se você usa isso em presenças)
router.get('/coberturas', colaboradoresController.listarCoberturas);

// Formulário de edição
router.get('/editar/:id', colaboradoresController.formEditar);

// Atualizar colaborador
router.post('/editar/:id', colaboradoresController.atualizar);

// Ativar / Inativar (toggle)
router.post('/toggle-ativo/:id', colaboradoresController.toggleAtivo);

module.exports = router;