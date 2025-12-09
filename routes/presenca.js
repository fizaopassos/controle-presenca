const express = require('express');
const router = express.Router();
const presencaController = require('../controllers/presencaController');
const { isAuthenticated } = require('../middlewares/auth');

// Aplicar autenticação em todas as rotas
router.use(isAuthenticated);

// ========== TELAS ==========
router.get('/lancar', presencaController.getLancarPresenca);
router.get('/consultar', presencaController.getConsultarPresenca);

// ========== APIs ==========
router.get('/api/postos/:condominio_id', presencaController.getPostosPorCondominio);
router.get('/api/colaboradores/:posto_id', presencaController.getColaboradoresPorPosto);
router.post('/api/salvar', presencaController.salvarPresencas);
router.get('/api/buscar', presencaController.buscarPresencas);
router.get('/api/colaboradores-busca', presencaController.buscarColaboradores);

module.exports = router;
