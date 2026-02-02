// middlewares/auth.js

function redirectToLogin(req, res) {
const loginUrl = '/auth/login';

if (req.get('HX-Request') === 'true') {
res.set('HX-Redirect', loginUrl);
return res.status(200).send(''); // mais confiável que 204 no seu caso
}

return res.redirect(loginUrl);
}
// Usuário autenticado
function isAuthenticated(req, res, next) {
if (req.session && req.session.user) return next();
return redirectToLogin(req, res);
}

// Apenas admin
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.perfil === 'admin') {
    return next();
  }
  return res.status(403).send('Acesso negado. Apenas administradores podem acessar.');
}

// Permitir apenas certos perfis
function allowPerfis(perfisPermitidos) {
  return function (req, res, next) {
    const usuario = req.session && req.session.user;

   if (!usuario) {
return redirectToLogin(req, res);
}
    if (perfisPermitidos.includes(usuario.perfil)) {
      return next();
    }

    return res.status(403).send('Acesso negado para seu perfil.');
  };
}

// Verificar acesso ao condomínio
async function checkCondominioAccess(req, res, next) {
  try {
    const usuario = req.session && req.session.user;

    if (!usuario) {
      return redirectToLogin(req, res);
    }

    const params = req.params || {};
    const body = req.body || {};
    const query = req.query || {};

    const condominioId =
      params.condominio_id ||
      params.id ||
      body.condominio_id ||
      query.condominio_id;

    // Se não tiver condominio_id na rota, não bloqueia
    if (!condominioId) {
      return next();
    }

    // MUDANÇA: Admin tem acesso total, gestor e lançador verificam lista
    if (usuario.perfil === 'admin') {
      return next();
    }

    // Gestor e lançador: confere se condomínio está na lista da sessão
    const lista = Array.isArray(usuario.condominios) ? usuario.condominios : [];
    const idNum = parseInt(condominioId, 10);

    if (!Number.isFinite(idNum)) {
      return res.status(400).send('condominio_id inválido.');
    }

    const temAcesso = lista.some(c => Number(c.id) === idNum);

    if (temAcesso) {
      return next();
    }

    return res.status(403).send('Você não tem acesso a este condomínio.');
  } catch (error) {
    console.error('Erro ao verificar acesso ao condomínio:', error);

    const msg = (process.env.NODE_ENV !== 'production')
      ? 'Erro ao verificar permissões: ' + (error && error.message ? error.message : String(error))
      : 'Erro ao verificar permissões.';

    return res.status(500).send(msg);
  }
}

// Permitir apenas admin e gestor
function isAdminOrGestor(req, res, next) {
  if (req.session && req.session.user && ['admin', 'gestor'].includes(req.session.user.perfil)) {
    return next();
  }
  return res.status(403).send('Acesso negado. Apenas administradores e gestores podem realizar esta ação.');
}


module.exports = {
  isAuthenticated,
  isAdmin,
  isAdminOrGestor,
  checkCondominioAccess,
  allowPerfis
};

