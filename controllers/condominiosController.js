const db = require('../config/db');

// Listar todos os condomínios
exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM condominios ORDER BY nome'
    );

    res.render('condominios/lista', {
      usuario: req.session.user,
      condominios: rows
    });
  } catch (error) {
    console.error('Erro ao listar condomínios:', error);
    res.status(500).send('Erro ao listar condomínios');
  }
};

// Mostrar formulário de novo condomínio
exports.formNovo = (req, res) => {
  res.render('condominios/form', {
    usuario: req.session.user,
    condominio: null,
    acao: 'novo'
  });
};

// Criar novo condomínio
exports.criar = async (req, res) => {
  const { nome, codigo_interno, endereco, cidade, estado } = req.body;

  if (!nome || nome.trim() === '') {
    // Idealmente: voltar para o form com erro, mas por simplicidade agora:
    return res.status(400).send('Nome é obrigatório.');
  }

  try {
    await db.query(
      'INSERT INTO condominios (nome, codigo_interno, endereco, cidade, estado, ativo) VALUES (?, ?, ?, ?, ?, TRUE)',
      [nome, codigo_interno || null, endereco || null, cidade || null, estado || null]
    );

    res.redirect('/condominios');
  } catch (error) {
    console.error('Erro ao criar condomínio:', error);
    res.status(500).send('Erro ao criar condomínio');
  }
};

// Mostrar formulário de edição
exports.formEditar = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT * FROM condominios WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send('Condomínio não encontrado');
    }

    res.render('condominios/form', {
      usuario: req.session.user,
      condominio: rows[0],
      acao: 'editar'
    });
  } catch (error) {
    console.error('Erro ao carregar condomínio:', error);
    res.status(500).send('Erro ao carregar condomínio');
  }
};

// Atualizar condomínio
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome, codigo_interno, endereco, cidade, estado, ativo } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).send('Nome é obrigatório.');
  }

  const ativoBool = ativo === 'on' ? 1 : 0;

  try {
    await db.query(
      'UPDATE condominios SET nome = ?, codigo_interno = ?, endereco = ?, cidade = ?, estado = ?, ativo = ? WHERE id = ?',
      [nome, codigo_interno || null, endereco || null, cidade || null, estado || null, ativoBool, id]
    );

    res.redirect('/condominios');
  } catch (error) {
    console.error('Erro ao atualizar condomínio:', error);
    res.status(500).send('Erro ao atualizar condomínio');
  }
};

// Ativar / Inativar condomínio (toggle)
exports.toggleAtivo = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT ativo FROM condominios WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send('Condomínio não encontrado');
    }

    const ativoAtual = rows[0].ativo;
    const novoAtivo = !ativoAtual;

    await db.query(
      'UPDATE condominios SET ativo = ? WHERE id = ?',
      [novoAtivo, id]
    );

    res.redirect('/condominios');
  } catch (error) {
    console.error('Erro ao alterar status do condomínio:', error);
    res.status(500).send('Erro ao alterar status do condomínio');
  }
};
