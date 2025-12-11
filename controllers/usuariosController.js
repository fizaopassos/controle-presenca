const db = require('../config/db'); // mysql2/promise

// Adicionar Usuários

const bcrypt = require('bcrypt');

// ... funções existentes (listar, editarForm, editarSalvar)

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

// Excluir usuário

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;

    // Não permite excluir o próprio usuário logado
    if (parseInt(id) === req.session.user.id) {
      return res.status(400).json({ erro: 'Você não pode excluir seu próprio usuário' });
    }

    // Remove vínculos de condomínios
    await db.query('DELETE FROM usuario_condominios WHERE usuario_id = ?', [id]);

    // Remove usuário
    await db.query('DELETE FROM usuarios WHERE id = ?', [id]);

    res.json({ sucesso: true });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ erro: 'Erro ao excluir usuário' });
  }
};


// Salvar novo usuário
exports.novoSalvar = async (req, res) => {
  try {
    const { nome, email, senha, perfil, condominios } = req.body;

    // Validações básicas
    if (!nome || !email || !senha || !perfil) {
      return res.status(400).send('Todos os campos obrigatórios devem ser preenchidos');
    }

    // Verifica se e-mail já existe
    const [existente] = await db.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existente.length > 0) {
      return res.status(400).send('Este e-mail já está cadastrado');
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Insere usuário
    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
      [nome, email, senhaHash, perfil]
    );

    const usuarioId = result.insertId;

    // Se não for ADMIN, vincula condomínios
    if (perfil !== 'ADMIN' && condominios) {
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


// Form de edição (perfil + condomínios)
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
exports.editarSalvar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, perfil, condominios } = req.body;

    // Atualiza dados básicos
    await db.query(
      'UPDATE usuarios SET nome = ?, email = ?, perfil = ? WHERE id = ?',
      [nome, email, perfil, id]
    );

    // Atualiza permissões de condomínios
    // 1) Remove todas as permissões atuais
    await db.query(
      'DELETE FROM usuario_condominios WHERE usuario_id = ?',
      [id]
    );

    // 2) Se não for ADMIN, insere as seleções (ADMIN vê tudo, não precisa vincular)
    if (perfil !== 'ADMIN' && condominios) {
      // condominios pode ser string (um valor) ou array (vários)
      const condoArray = Array.isArray(condominios) ? condominios : [condominios];

      for (const condId of condoArray) {
        await db.query(
          'INSERT INTO usuario_condominios (usuario_id, condominio_id) VALUES (?, ?)',
          [id, condId]
        );
      }
    }

  // Adicionar Usuários

    res.redirect('/usuarios');
  } catch (error) {
    console.error('Erro ao salvar edição de usuário:', error);
    res.status(500).send('Erro ao salvar edição de usuário');
  }
};
