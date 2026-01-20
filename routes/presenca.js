const express = require('express');
const router = express.Router();
const { isAuthenticated, checkCondominioAccess } = require('../middlewares/auth');
const presencaController = require('../controllers/presencaController');

// ========================================
// TELAS (renderizam HTML)
// ========================================
router.get('/lancar', isAuthenticated, presencaController.getLancarPresenca);
router.get('/consultar', isAuthenticated, presencaController.getConsultarPresenca);

// ========================================
// APIs (retornam JSON)
// ========================================

// Buscar postos de um condomínio
router.get('/api/postos/:condominio_id', 
  isAuthenticated, 
  presencaController.getPostos
);

/*// Buscar colaboradores de um posto
router.get('/api/colaboradores/:posto_id', 
  isAuthenticated, 
  presencaController.getFuncionarios
);*/

// NOVO: Buscar colaboradores por condomínio (sem filtro de posto)
router.get('/api/colaboradores/condominio/:condominio_id',
  isAuthenticated,
  presencaController.getFuncionariosPorCondominio
);

router.get(
  '/api/coberturas/empresa/:empresa_id',
  isAuthenticated,
  presencaController.getCoberturasPorEmpresa
);

// Lançar presença
router.post('/api/lancar', 
  isAuthenticated, 
  presencaController.lancarPresenca
);

// Consultar presenças
router.get('/api/consultar', 
  isAuthenticated, 
  presencaController.consultarPresencas
);

// Buscar colaboradores (autocomplete)
router.get('/api/colaboradores', 
  isAuthenticated, 
  presencaController.buscarColaboradores
);

/*// Salvar presença individual (HTMX)
router.post('/api/salvar-individual', 
  isAuthenticated, 
  presencaController.salvarPresencaIndividual
);*/


module.exports = router;
