const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// helper para renderizar a tela de login sempre via layout
function renderLogin(res, errorMessage) {
  res.render('layout', {
    title: 'Login',
    page: 'auth/login',
    showNavbar: false,
    mainClass: 'container',
    menuAtivo: '',
    error: errorMessage || null
  });
}

router.get('/login', (req, res) => {
if (req.session && req.session.user) {
return res.redirect('/dashboard');
}
return renderLogin(res, null);
});

router.post('/login', async (req, res) => {
try {
const { email, senha } = req.body;

if (!email || !senha) {
  return renderLogin(res, 'Preencha email e senha');
}

const [usuarios] = await db.query(
  'SELECT * FROM usuarios WHERE email = ? AND ativo = 1',
  [email]
);

if (usuarios.length === 0) {
  return renderLogin(res, 'Email ou senha inválidos');
}

const usuario = usuarios[0];

if (!usuario.senha_hash) {
  console.error('Usuário sem senha_hash:', email);
  return renderLogin(res, 'Usuário sem senha cadastrada. Contate o administrador.');
}

const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
if (!senhaValida) {
  return renderLogin(res, 'Email ou senha inválidos');
}

const [condominios] = await db.query(`
  SELECT c.id, c.nome
  FROM condominios c
  INNER JOIN usuario_condominios uc ON c.id = uc.condominio_id
  WHERE uc.usuario_id = ?
  ORDER BY c.nome
`, [usuario.id]);

req.session.user = {
  id: usuario.id,
  nome: usuario.nome,
  email: usuario.email,
  perfil: usuario.perfil,
  condominios
};

return req.session.save((err) => {
  if (err) {
    console.error('Erro ao salvar sessão:', err);
    return renderLogin(res, 'Erro ao processar login. Tente novamente.');
  }
  return res.redirect('/dashboard');
});

} catch (error) {
console.error('Erro no login:', error);
return renderLogin(res, 'Erro ao processar login. Tente novamente.');
}
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao destruir sessão:', err);
    }
    res.redirect('/auth/login');
  });
});

module.exports = router;
