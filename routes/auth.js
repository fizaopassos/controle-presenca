const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Página de login
router.get('/login', (req, res) => {
if (req.session && req.session.user) {
return res.redirect('/dashboard');
}
res.render('auth/login', { error: null });
});

// Processar login
router.post('/login', async (req, res) => {
try {
const { email, senha } = req.body;

// Validação básica
if (!email || !senha) {
  return res.render('auth/login', { 
    error: 'Preencha email e senha' 
  });
}

// Busca usuário
const [usuarios] = await db.query(
  'SELECT * FROM usuarios WHERE email = ? AND ativo = 1',
  [email]
);

if (usuarios.length === 0) {
  return res.render('auth/login', { 
    error: 'Email ou senha inválidos' 
  });
}

/*const usuario = usuarios[0];

console.log('=== DEBUG LOGIN ===');
console.log('Email:', email);
console.log('Campos:', Object.keys(usuario));
console.log('senha_hash existe?', !!usuario.senha_hash);

// Garante que existe hash
const hashSenha = usuario.senha_hash;
if (!hashSenha) {
  console.error('⚠️ Usuário sem senha_hash:', email);
  return res.render('auth/login', { 
    error: 'Usuário sem senha cadastrada. Contate o administrador.' 
  });
}*/

const usuario = usuarios[0];

// Normaliza perfil para minúsculo (admin, user, etc.)
const perfilNormalizado = (usuario.perfil || '').toLowerCase();

// DEBUG opcional – pode deixar por enquanto
console.log('=== DEBUG LOGIN ===');
console.log('Email:', email);
console.log('Perfil no banco:', usuario.perfil);
console.log('Perfil na sessão (normalizado):', perfilNormalizado);
console.log('Campos disponíveis no usuário:', Object.keys(usuario));
console.log('Resumo senha:', {
  senha: usuario.senha ? 'EXISTE' : 'undefined/null',
  senha_hash: usuario.senha_hash ? 'EXISTE' : 'undefined/null',
  password: usuario.password ? 'EXISTE' : 'undefined/null'
});

// Descobre qual coluna tem o hash da senha
const hashSenha = usuario.senha || usuario.senha_hash || usuario.password;

if (!hashSenha) {
  console.error('⚠️ Usuário sem hash de senha armazenado:', email);
  return res.render('auth/login', { 
    error: 'Usuário sem senha cadastrada. Contate o administrador.' 
  });
}


// Verifica senha
const senhaValida = await bcrypt.compare(senha, hashSenha);
console.log('Senha válida?', senhaValida);

if (!senhaValida) {
  return res.render('auth/login', { 
    error: 'Email ou senha inválidos' 
  });
}

// Busca condomínios do usuário
const [condominios] = await db.query(`
  SELECT c.id, c.nome 
  FROM condominios c
  INNER JOIN usuario_condominios uc ON c.id = uc.condominio_id
  WHERE uc.usuario_id = ?
  ORDER BY c.nome
`, [usuario.id]);

/*// Salva na sessão
req.session.user = {
  id: usuario.id,
  nome: usuario.nome,
  email: usuario.email,
  perfil: usuario.perfil,
  condominios: condominios
};*/

req.session.user = {
  id: usuario.id,
  nome: usuario.nome,
  email: usuario.email,
  perfil: perfilNormalizado,
  condominios: condominios
};


res.redirect('/dashboard');

} catch (error) {
console.error('Erro no login:', error);
res.render('auth/login', {
error: 'Erro ao processar login. Tente novamente.'
});
}
});

// Logout
router.get('/logout', (req, res) => {
req.session.destroy((err) => {
if (err) {
console.error('Erro ao destruir sessão:', err);
}
res.redirect('/login');
});
});

module.exports = router;
