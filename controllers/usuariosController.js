const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Form de novo usuário
exports.novoForm = async (req, res) => {
  try {
    const [condominios] = await db.query(
      'SELECT id, nome FROM condominios ORDER BY nome'
    );

    res.render('layout', {
      title: 'Novo Usuário',
      menuAtivo: 'admin',
      page: 'usuarios/novo',
      condominios
    });
  } catch (error) {
    console.error('Erro ao carregar form de novo usuário:', error);
    res.status(500).send('Erro ao carregar form de novo usuário');
  }
};

// Salvar novo usuário
exports.novoSalvar = async (req, res) => {
  try {
    let { nome, email, senha, perfil, condominios } = req.body;

    if (!nome || !email || !senha || !perfil) {
      return res.status(400).send('Todos os campos obrigatórios devem ser preenchidos');
    }

    perfil = perfil.toLowerCase();

    const [existente] = await db.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existente.length > 0) {
      return res.status(400).send('Este e-mail já está cadastrado');
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)',
      [nome, email, senhaHash, perfil]
    );

    const usuarioId = result.insertId;

    // ✅ CORRIGIDO: gestor e lançador vinculam condomínios (admin não precisa)
    if (perfil !== 'admin' && condominios) {
      const condoArray = Array.isArray(condominios) ? condominios : [condominios];

      for (const condId of condoArray) {
        await db.query(
          'INSERT INTO usuario_condominios (usuario_id, condominio_id) VALUES (?, ?)',
          [usuarioId, condId]
        );
      }
    }

    res.redirect('/usuarios');
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).send('Erro ao criar usuário');
  }
};

// Lista usuários
exports.listar = async (req, res) => {
  try {
    const [usuarios] = await db.query(`
      SELECT id, nome, email, perfil
      FROM usuarios
      ORDER BY nome
    `);

    res.render('layout', {
      title: 'Usuários',
      menuAtivo: 'admin',
      page: 'usuarios/index',
      usuarios
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).send('Erro ao listar usuários');
  }
};

// Form de edição
exports.editarForm = async (req, res) => {
  try {
    const { id } = req.params;

    const [[usuario]] = await db.query(
      'SELECT id, nome, email, perfil FROM usuarios WHERE id = ?',
      [id]
    );

    if (!usuario) {
      return res.status(404).send('Usuário não encontrado');
    }

    const [condominios] = await db.query(
      'SELECT id, nome FROM condominios ORDER BY nome'
    );

    const [permissoes] = await db.query(
      'SELECT condominio_id FROM usuario_condominios WHERE usuario_id = ?',
      [id]
    );

    const condoIdsPermitidos = permissoes.map(p => p.condominio_id);

    res.render('layout', {
      title: 'Editar Usuário',
      menuAtivo: 'admin',
      page: 'usuarios/form',
      usuario,
      condominios,
      condoIdsPermitidos
    });
  } catch (error) {
    console.error('Erro ao carregar edição de usuário:', error);
    res.status(500).send('Erro ao carregar edição de usuário');
  }
};

// Salvar edição
// Salvar edição
exports.editarSalvar = async (req, res) => {
  try {
    const { id } = req.params;
    let { nome, email, perfil, condominios, senha, senhaConfirm } = req.body;

    if (!nome || !email || !perfil) {
      return res.status(400).send('Nome, e-mail e perfil são obrigatórios.');
    }

    perfil = perfil.toLowerCase();

    // Opcional: impedir e-mail duplicado em outro usuário
    const [outroComMesmoEmail] = await db.query(
      'SELECT id FROM usuarios WHERE email = ? AND id <> ?',
      [email, id]
    );
    if (outroComMesmoEmail.length > 0) {
      return res.status(400).send('Já existe um usuário com este e-mail.');
    }

    // Monta o UPDATE, com ou sem alteração de senha
    let query;
    let params;

    senha = (senha || '').trim();
    senhaConfirm = (senhaConfirm || '').trim();

    if (senha) {
      // Quer trocar a senha
      if (senha.length < 6) {
        return res.status(400).send('A senha deve ter pelo menos 6 caracteres.');
      }
      if (senha !== senhaConfirm) {
        return res.status(400).send('A confirmação de senha não confere.');
      }

      const senhaHash = await bcrypt.hash(senha, 10);

      query = `
        UPDATE usuarios
        SET nome = ?, email = ?, perfil = ?, senha_hash = ?
        WHERE id = ?
      `;
      params = [nome, email, perfil, senhaHash, id];
    } else {
      // Não altera a senha
      query = `
        UPDATE usuarios
        SET nome = ?, email = ?, perfil = ?
        WHERE id = ?
      `;
      params = [nome, email, perfil, id];
    }

    await db.query(query, params);

    // Remove vínculos antigos
    await db.query(
      'DELETE FROM usuario_condominios WHERE usuario_id = ?',
      [id]
    );

    // gestor / lancador vinculam condomínios (admin não precisa)
    if (perfil !== 'admin' && condominios) {
      const condoArray = Array.isArray(condominios) ? condominios : [condominios];

      for (const condId of condoArray) {
        await db.query(
          'INSERT INTO usuario_condominios (usuario_id, condominio_id) VALUES (?, ?)',
          [id, condId]
        );
      }
    }

    res.redirect('/usuarios');
  } catch (error) {
    console.error('Erro ao salvar edição de usuário:', error);
    res.status(500).send('Erro ao salvar edição de usuário');
  }
};

// Excluir usuário
exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id, 10) === req.session.user.id) {
      return res.status(400).json({ erro: 'Você não pode excluir seu próprio usuário' });
    }

    await db.query('DELETE FROM usuario_condominios WHERE usuario_id = ?', [id]);
    await db.query('DELETE FROM usuarios WHERE id = ?', [id]);

    res.json({ sucesso: true });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ erro: 'Erro ao excluir usuário' });
  }
};
