const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin, checkCondominioAccess } = require('../middlewares/auth');
const condominiosController = require('../controllers/condominiosController');

// Listar condomínios (todos podem ver os seus)
router.get('/', isAuthenticated, condominiosController.listar);

// Formulário de novo condomínio
router.get('/novo', isAuthenticated, isAdmin, condominiosController.formNovo);

// Criar condomínio (apenas admin)
router.post('/', isAuthenticated, isAdmin, condominiosController.criar);

// Formulário de edição
router.get('/:id/editar', isAuthenticated, isAdmin, condominiosController.formEditar);

// Atualizar condomínio (apenas admin)
router.post('/:id', isAuthenticated, isAdmin, condominiosController.atualizar);
// Toggle ativo/inativo
router.patch('/:id/toggle', isAuthenticated, isAdmin, condominiosController.toggleAtivo);

// Deletar condomínio (apenas admin)
router.delete('/:id', isAuthenticated, isAdmin, condominiosController.deletar);

// Ver detalhes de um condomínio (precisa ter acesso)
router.get('/:id', isAuthenticated, checkCondominioAccess, condominiosController.detalhes);

module.exports = router;
