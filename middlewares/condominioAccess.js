const db = require('../config/db');

/**
 * Middleware que valida se o usuário tem acesso ao condomínio especificado
 * Usar em rotas que recebem :condominio_id (ou :condominioId)
 */
const checkCondominioAccess = (req, res, next) => {
  try {
    // Pega o condominio_id da query, params ou body
    const condominioId = req.query.condominio_id || 
                        req.params.condominio_id || 
                        req.body.condominio_id;

    // Se não tiver condominio_id, permite passar (validação será no controller)
    if (!condominioId) {
      return next();
    }

    // Verifica se o usuário tem acesso ao condomínio
    const userCondominios = req.user.condominios || [];
    
    // Admin tem acesso a tudo
    if (req.user.role === 'admin') {
      return next();
    }

    // Verifica se o condomínio está na lista de acesso do usuário
    const hasAccess = userCondominios.some(c => c.id === parseInt(condominioId));

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado a este condomínio' 
      });
    }

    next();
  } catch (error) {
    console.error('Erro no middleware de acesso ao condomínio:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao verificar acesso' 
    });
  }
};

module.exports = { checkCondominioAccess };

