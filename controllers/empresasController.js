const db = require('../config/db');

// Listar todas as empresas
exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM empresas ORDER BY nome'
    );

    res.render('empresas/lista', {
      usuario: req.session.user,
      empresas: rows
    });
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).send('Erro ao listar empresas');
  }
};

// Mostrar formulário de nova empresa
exports.formNovo = (req, res) => {
  res.render('empresas/form', {
    usuario: req.session.user,
    empresa: null,
    acao: 'novo'
  });
};

// Criar nova empresa
exports.criar = async (req, res) => {
  const { nome, cnpj, telefone, email, responsavel } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).send('Nome é obrigatório.');
  }

  try {
    await db.query(
      'INSERT INTO empresas (nome, cnpj, telefone, email, responsavel, ativo) VALUES (?, ?, ?, ?, ?, TRUE)',
      [nome, cnpj || null, telefone || null, email || null, responsavel || null]
    );

    res.redirect('/empresas');
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).send('Erro ao criar empresa');
  }
};

// Mostrar formulário de edição
exports.formEditar = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT * FROM empresas WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send('Empresa não encontrada');
    }

    res.render('empresas/form', {
      usuario: req.session.user,
      empresa: rows[0],
      acao: 'editar'
    });
  } catch (error) {
    console.error('Erro ao carregar empresa:', error);
    res.status(500).send('Erro ao carregar empresa');
  }
};

// Atualizar empresa
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome, cnpj, telefone, email, responsavel, ativo } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).send('Nome é obrigatório.');
  }

  const ativoBool = ativo === 'on' ? 1 : 0;

  try {
    await db.query(
      'UPDATE empresas SET nome = ?, cnpj = ?, telefone = ?, email = ?, responsavel = ?, ativo = ? WHERE id = ?',
      [nome, cnpj || null, telefone || null, email || null, responsavel || null, ativoBool, id]
    );

    res.redirect('/empresas');
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).send('Erro ao atualizar empresa');
  }
};

// Ativar / Inativar empresa (toggle)
exports.toggleAtivo = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT ativo FROM empresas WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send('Empresa não encontrada');
    }

    const ativoAtual = rows[0].ativo;
    const novoAtivo = !ativoAtual;

    await db.query(
      'UPDATE empresas SET ativo = ? WHERE id = ?',
      [novoAtivo, id]
    );

    res.redirect('/empresas');
  } catch (error) {
    console.error('Erro ao alterar status da empresa:', error);
    res.status(500).send('Erro ao alterar status da empresa');
  }
};
