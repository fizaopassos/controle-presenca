// middlewares/auth.js

/*// Verifica se o usuário está autenticado
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
};

// Verifica se o usuário é admin
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.perfil === 'admin') {
    return next();
  }
  res.status(403).send('Acesso negado. Apenas administradores.');
};

// Verifica se o usuário tem acesso ao condomínio
const checkCondominioAccess = async (req, res, next) => {
  const user = req.session.user;
  const condominioId = req.params.id || req.body.condominio_id || req.query.condominio_id;

  // Admin tem acesso a tudo
  if (user.perfil === 'admin') {
    return next();
  }

  // Verifica se o usuário tem acesso ao condomínio
  const db = require('../config/db');
  const [acesso] = await db.query(
    'SELECT 1 FROM usuario_condominios WHERE usuario_id = ? AND condominio_id = ?',
    [user.id, condominioId]
  );

  if (acesso.length > 0) {
    return next();
  }

  res.status(403).send('Você não tem acesso a este condomínio.');
};

module.exports = {
  isAuthenticated,
  isAdmin,
  checkCondominioAccess
};*/

// Middleware para verificar se usuário está autenticado
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
}

// Middleware para verificar se é admin
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.perfil === 'admin') {
    return next();
  }
  res.status(403).render('error', { 
    message: 'Acesso negado. Apenas administradores podem acessar.' 
  });
}

// Middleware para verificar acesso ao condomínio
async function checkCondominioAccess(req, res, next) {
  try {
    const condominioId = req.params.condominio_id || req.params.id;
    const usuario = req.session.user;

    // Admin tem acesso a tudo
    if (usuario.perfil === 'admin') {
      return next();
    }

    // Verifica se o usuário tem acesso ao condomínio
    const temAcesso = usuario.condominios.some(
      c => c.id === parseInt(condominioId)
    );

    if (temAcesso) {
      return next();
    }

    res.status(403).render('error', { 
      message: 'Você não tem acesso a este condomínio.' 
    });

  } catch (error) {
    console.error('Erro ao verificar acesso ao condomínio:', error);
    res.status(500).render('error', { 
      message: 'Erro ao verificar permissões.' 
    });
  }
}

module.exports = {
  isAuthenticated,
  isAdmin,
  checkCondominioAccess
};
