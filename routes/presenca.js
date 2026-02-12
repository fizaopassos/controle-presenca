const express = require('express');
const router = express.Router();

const { isAuthenticated, allowPerfis, checkCondominioAccess } = require('../middlewares/auth');
const presencaController = require('../controllers/presencaController');

// Todos precisam estar logados e ser admin / gestor / lancador
router.use(isAuthenticated, allowPerfis(['admin', 'gestor', 'lancador']));

// ========================================
// TELAS (renderizam HTML)
// ========================================

// Aqui o condominio_id geralmente vem via query (?condominio_id=1)
// O checkCondominioAccess já olha params, body e query
router.get('/lancar', checkCondominioAccess, presencaController.getLancarPresenca);
router.get('/consultar', checkCondominioAccess, presencaController.getConsultarPresenca);

// ========================================
// APIs (retornam JSON)
// ========================================

// Buscar postos de um condomínio
router.get(
  '/api/postos/:condominio_id',
  checkCondominioAccess,
  presencaController.getPostos
);

// Buscar colaboradores por condomínio (sem filtro de posto)
router.get(
  '/api/colaboradores/condominio/:condominio_id',
  checkCondominioAccess,
  presencaController.getFuncionariosPorCondominio
);

// Coberturas por empresa (não está atrelado a condomínio específico)
router.get(
  '/api/coberturas/empresa/:empresa_id',
  presencaController.getCoberturasPorEmpresa
);

// Lançar presença (condominio_id deve vir no body)
router.post(
  '/api/lancar',
  checkCondominioAccess,
  presencaController.lancarPresenca
);


// Consultar presenças (condominio_id normalmente vem na query)
router.get(
  '/api/consultar',
  checkCondominioAccess,
  presencaController.consultarPresencas
);

// Buscar colaboradores (autocomplete)
// Se um dia você passar condominio_id aqui, dá pra adicionar o checkCondominioAccess também
// Buscar colaboradores (autocomplete) - CONSULTA
router.get(
  '/api/colaboradores',
  presencaController.buscarColaboradores
);

// Buscar colaboradores (autocomplete) - LANÇAR (com ?empresa_id=&q=)
router.get(
  '/api/colaboradores/buscar',
  presencaController.buscarColaboradores
);


router.get(
  '/api/dias-lancados',
  checkCondominioAccess,
  presencaController.getDiasLancados
);

// Relatório consolidado mensal (PDF)
router.get(
  '/relatorios/mensal/pdf',
  checkCondominioAccess,
  presencaController.relatorioMensalPdf
);

// Relatório detalhado por colaborador (PDF)
router.get(
  '/relatorios/colaborador/pdf',
  checkCondominioAccess,
  presencaController.relatorioColaboradorPdf
);


module.exports = router;
