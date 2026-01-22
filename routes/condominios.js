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

// Listar condomínios
// admin/gestor: veem todos
// lancador: depois a gente pode filtrar no controller se quiser, mas já está logado
router.get('/', allowPerfis(['admin', 'gestor', 'lancador']), condominiosController.listar);

// Formulário de novo condomínio (admin e gestor podem)
router.get('/novo', allowPerfis(['admin', 'gestor']), condominiosController.formNovo);

// Criar condomínio (admin e gestor)
router.post('/', allowPerfis(['admin', 'gestor']), condominiosController.criar);

// Formulário de edição (admin e gestor)
router.get('/:id/editar', allowPerfis(['admin', 'gestor']), condominiosController.formEditar);

// Atualizar condomínio (admin e gestor)
router.post('/:id', allowPerfis(['admin', 'gestor']), condominiosController.atualizar);

// Toggle ativo/inativo (admin e gestor)
router.patch('/:id/toggle', allowPerfis(['admin', 'gestor']), condominiosController.toggleAtivo);

// Deletar condomínio (se quiser só admin, troca o allowPerfis por isAdmin)
router.delete('/:id', isAdmin, condominiosController.deletar);

// Ver detalhes de um condomínio
// admin/gestor: acesso total
// lancador: passa pelo checkCondominioAccess para conferir se tem acesso àquele condomínio
router.get('/:id', allowPerfis(['admin', 'gestor', 'lancador']), checkCondominioAccess, condominiosController.detalhes);

module.exports = router;
