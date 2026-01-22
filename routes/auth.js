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

    // Busca usuário ativo
    const [usuarios] = await db.query(
      'SELECT * FROM usuarios WHERE email = ? AND ativo = 1',
      [email]
    );

    if (usuarios.length === 0) {
      return res.render('auth/login', {
        error: 'Email ou senha inválidos'
      });
    }

    const usuario = usuarios[0];

    // Garante que existe senha_hash
    if (!usuario.senha_hash) {
      console.error('Usuário sem senha_hash:', email);
      return res.render('auth/login', {
        error: 'Usuário sem senha cadastrada. Contate o administrador.'
      });
    }

    // Verifica senha (bcryptjs)
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.render('auth/login', {
        error: 'Email ou senha inválidos'
      });
    }

    // Busca condomínios do usuário (se usar controle por condomínio)
    const [condominios] = await db.query(`
  SELECT c.id, c.nome 
  FROM condominios c
  INNER JOIN usuario_condominios uc ON c.id = uc.condominio_id
  WHERE uc.usuario_id = ?
  ORDER BY c.nome
`, [usuario.id]);

    console.log('Login bem-sucedido para:', usuario.email);
    console.log('Condominios encontrados:', condominios.length);
    console.log('Perfil do usuário:', usuario.perfil);

    // Salva usuário na sessão
    req.session.user = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil, // 'admin', 'gestor', 'lancador'
      condominios
    };

    console.log('Sessão criada:', req.session.user);

    // IMPORTANTE: Salvar a sessão antes de redirecionar
    req.session.save((err) => {
      if (err) {
        console.error('Erro ao salvar sessão:', err);
        return res.render('auth/login', {
          error: 'Erro ao processar login. Tente novamente.'
        });
      }
      console.log('Sessão salva com sucesso! Redirecionando para /dashboard');
      res.redirect('/dashboard');
    });

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