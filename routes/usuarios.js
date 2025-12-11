const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const usuariosController = require('../controllers/usuariosController');

// Verificação de segurança
if (typeof isAuthenticated !== 'function') {
  throw new Error('isAuthenticated não é uma função válida');
}

// ===== ROTAS DE USUÁRIOS =====

// Tela de listagem
router.get('/', isAuthenticated, usuariosController.listar);

// Tela de cadastro
router.get('/novo', isAuthenticated, usuariosController.novoForm);

// Criar usuário
router.post('/criar', isAuthenticated, usuariosController.novoSalvar);

// Tela de edição
router.get('/editar/:id', isAuthenticated, usuariosController.editarForm);

// Atualizar usuário
router.post('/atualizar/:id', isAuthenticated, usuariosController.editarSalvar);

// Deletar usuário
router.post('/deletar/:id', isAuthenticated, usuariosController.excluir);

module.exports = router;
