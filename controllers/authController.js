const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.showLogin = (req, res) => {
  // Se já estiver logado, manda direto pro dashboard
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', { error: null });
};

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    // Buscar usuário no banco
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE email = ? AND ativo = TRUE',
      [email]
    );

    if (rows.length === 0) {
      return res.render('auth/login', { 
        error: 'Usuário não encontrado ou inativo.' 
      });
    }

    const usuario = rows[0];

    // Verificar senha
    const senhaValida = bcrypt.compareSync(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.render('auth/login', { 
        error: 'Senha incorreta.' 
      });
    }

    // Criar sessão
    req.session.user = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    };

    return res.redirect('/dashboard');

  } catch (error) {
    console.error('Erro no login:', error);
    return res.render('auth/login', { 
      error: 'Erro ao processar login. Tente novamente.' 
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });

  
};
