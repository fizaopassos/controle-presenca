const db = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /perfil/alterar-senha
exports.alterarSenhaForm = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/auth/login');
  }

  res.render('layout', {
    title: 'Alterar senha',
    menuAtivo: 'perfil',      // se um dia quiser ter item na sidebar
    page: 'auth/alterar_senha',
    usuario: req.session.user,
    query: req.query          // para mostrar mensagem "senha alterada" via ?ok=1
  });
};

// POST /perfil/alterar-senha
exports.alterarSenhaSalvar = async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).send('Sessão expirada. Faça login novamente.');
    }

    const senhaAtual = (req.body.senhaAtual || '').trim();
    const novaSenha = (req.body.novaSenha || '').trim();
    const novaSenhaConfirm = (req.body.novaSenhaConfirm || '').trim();

    if (!senhaAtual || !novaSenha || !novaSenhaConfirm) {
      return res.status(400).send('Preencha todos os campos.');
    }

    if (novaSenha.length < 6) {
      return res.status(400).send('A nova senha deve ter pelo menos 6 caracteres.');
    }

    if (novaSenha !== novaSenhaConfirm) {
      return res.status(400).send('A confirmação da nova senha não confere.');
    }

    const [[usuario]] = await db.query(
      'SELECT id, senha_hash FROM usuarios WHERE id = ?',
      [userId]
    );

    if (!usuario) {
      return res.status(404).send('Usuário não encontrado.');
    }

    const confere = await bcrypt.compare(senhaAtual, usuario.senha_hash);
    if (!confere) {
      return res.status(400).send('Senha atual incorreta.');
    }

    const mesma = await bcrypt.compare(novaSenha, usuario.senha_hash);
    if (mesma) {
      return res.status(400).send('A nova senha não pode ser igual à senha atual.');
    }

    const novoHash = await bcrypt.hash(novaSenha, 10);

    await db.query(
      'UPDATE usuarios SET senha_hash = ? WHERE id = ?',
      [novoHash, userId]
    );

    // Mantém logado e mostra mensagem na própria tela
    return res.redirect('/perfil/alterar-senha?ok=1');

    // Se quiser forçar novo login:
    // req.session.destroy(() => res.redirect('/auth/login?senha=alterada'));
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return res.status(500).send('Erro ao alterar senha.');
  }
};
