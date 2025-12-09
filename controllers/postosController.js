const db = require('../config/db');

// Listar todos os postos com condomínio e empresa
exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        c.nome AS condominio_nome,
        e.nome AS empresa_nome
      FROM postos p
      LEFT JOIN condominios c ON p.condominio_id = c.id
      LEFT JOIN empresas e ON p.empresa_id = e.id
      ORDER BY p.nome
    `);

    res.render('postos/lista', {
      usuario: req.session.user,
      postos: rows
    });
  } catch (error) {
    console.error('Erro ao listar postos:', error);
    res.status(500).send('Erro ao listar postos');
  }
};

// Mostrar formulário de novo posto
exports.formNovo = async (req, res) => {
  try {
    const [condominios] = await db.query('SELECT id, nome FROM condominios WHERE ativo = TRUE ORDER BY nome');
    const [empresas] = await db.query('SELECT id, nome FROM empresas WHERE ativo = TRUE ORDER BY nome');

    res.render('postos/form', {
      usuario: req.session.user,
      posto: null,
      acao: 'novo',
      condominios,
      empresas
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};

// Criar novo posto
exports.criar = async (req, res) => {
  const { nome, condominio_id, empresa_id, descricao } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).send('Nome é obrigatório.');
  }

  if (!condominio_id || !empresa_id) {
    return res.status(400).send('Condomínio e Empresa são obrigatórios.');
  }

  try {
    await db.query(
      'INSERT INTO postos (nome, condominio_id, empresa_id, descricao, ativo) VALUES (?, ?, ?, ?, TRUE)',
      [nome, condominio_id, empresa_id, descricao || null]
    );

    res.redirect('/postos');
  } catch (error) {
    console.error('Erro ao criar posto:', error);
    res.status(500).send('Erro ao criar posto');
  }
};

// Mostrar formulário de edição
exports.formEditar = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM postos WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).send('Posto não encontrado');
    }

    const [condominios] = await db.query('SELECT id, nome FROM condominios WHERE ativo = TRUE ORDER BY nome');
    const [empresas] = await db.query('SELECT id, nome FROM empresas WHERE ativo = TRUE ORDER BY nome');

    res.render('postos/form', {
      usuario: req.session.user,
      posto: rows[0],
      acao: 'editar',
      condominios,
      empresas
    });
  } catch (error) {
    console.error('Erro ao carregar posto:', error);
    res.status(500).send('Erro ao carregar posto');
  }
};

// Atualizar posto
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome, condominio_id, empresa_id, descricao, ativo } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).send('Nome é obrigatório.');
  }

  if (!condominio_id || !empresa_id) {
    return res.status(400).send('Condomínio e Empresa são obrigatórios.');
  }

  const ativoBool = ativo === 'on' ? 1 : 0;

  try {
    await db.query(
      'UPDATE postos SET nome = ?, condominio_id = ?, empresa_id = ?, descricao = ?, ativo = ? WHERE id = ?',
      [nome, condominio_id, empresa_id, descricao || null, ativoBool, id]
    );

    res.redirect('/postos');
  } catch (error) {
    console.error('Erro ao atualizar posto:', error);
    res.status(500).send('Erro ao atualizar posto');
  }
};

// Ativar / Inativar posto (toggle)
exports.toggleAtivo = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT ativo FROM postos WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).send('Posto não encontrado');
    }

    const ativoAtual = rows[0].ativo;
    const novoAtivo = !ativoAtual;

    await db.query('UPDATE postos SET ativo = ? WHERE id = ?', [novoAtivo, id]);

    res.redirect('/postos');
  } catch (error) {
    console.error('Erro ao alterar status do posto:', error);
    res.status(500).send('Erro ao alterar status do posto');
  }
};
