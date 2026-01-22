const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const usuariosController = require('../controllers/usuariosController');

// Diagnóstico (deixe até funcionar; depois pode remover)
console.log('[usuarios routes] auth exports:', Object.keys(auth));
console.log('[usuarios routes] typeof isAuthenticated:', typeof auth.isAuthenticated);
console.log('[usuarios routes] typeof isAdmin:', typeof auth.isAdmin);

if (typeof auth.isAuthenticated !== 'function') {
throw new Error('middlewares/auth.js não exportou isAuthenticated como função');
}
if (typeof auth.isAdmin !== 'function') {
throw new Error('middlewares/auth.js não exportou isAdmin como função');
}

// Todas as rotas de usuário só para ADMIN
router.use(auth.isAuthenticated);
router.use(auth.isAdmin);

// Tela de listagem
router.get('/', usuariosController.listar);

// Tela de cadastro
router.get('/novo', usuariosController.novoForm);

// Criar usuário
router.post('/novo', usuariosController.novoSalvar);

// Tela de edição
router.get('/editar/:id', usuariosController.editarForm);

// Atualizar usuário
router.post('/editar/:id', usuariosController.editarSalvar);

// Excluir usuário
router.delete('/excluir/:id', usuariosController.excluir);

module.exports = router;