const express = require('express');
const router = express.Router();

const {
  isAuthenticated,
  isAdmin,
  allowPerfis,
  checkCondominioAccess
} = require('../middlewares/auth');

const condominiosController = require('../controllers/condominiosController');

// Todas as rotas exigem estar logado
router.use(isAuthenticated);

// ✅ CORRIGIDO: apenas ADMIN gerencia condomínios
router.get('/', isAdmin, condominiosController.listar);
router.get('/novo', isAdmin, condominiosController.formNovo);
router.post('/', isAdmin, condominiosController.criar);
router.get('/:id/editar', isAdmin, condominiosController.formEditar);
router.post('/:id', isAdmin, condominiosController.atualizar);
router.patch('/:id/toggle', isAdmin, condominiosController.toggleAtivo);
router.delete('/:id', isAdmin, condominiosController.deletar);
router.get('/:id', isAdmin, condominiosController.detalhes);

module.exports = router;
