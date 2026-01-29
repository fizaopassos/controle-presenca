const db = require('../config/db');

function isHTMX(req) {
  return req.get('HX-Request') === 'true';
}

function isPartial(req) {
  return req.query.partial === '1' || isHTMX(req);
}

// Listar empresas
exports.listar = async (req, res) => {
  try {
    const [empresas] = await db.query('SELECT * FROM empresas ORDER BY nome');

    return res.render('layout', {
      title: 'Empresas',
      page: 'empresas/lista',
      menuAtivo: 'cadastros',
      empresas
    });

  } catch (err) {
    console.error('Erro ao listar empresas:', err);
    return res.status(500).send('Erro ao listar empresas.');
  }
};

// Formulário de nova empresa
exports.formNovo = async (req, res) => {
  try {
    const viewData = {
      acao: 'novo',
      isNovo: true,
      empresa: null,
      isModal: isPartial(req)
    };

    if (viewData.isModal) {
      return res.render('empresas/_form', viewData);
    }

    return res.render('layout', {
      title: 'Nova Empresa',
      page: 'empresas/form',
      menuAtivo: 'cadastros',
      ...viewData
    });

  } catch (err) {
    console.error('Erro ao carregar form novo empresa:', err);
    return res.status(500).send('Erro ao carregar formulário.');
  }
};

// Criar empresa
exports.criar = async (req, res) => {
  try {
    const { nome, cnpj, telefone, email, endereco } = req.body;

    if (!nome || String(nome).trim() === '') {
      return res.status(400).send('Nome é obrigatório.');
    }

    const sql =
      'INSERT INTO empresas (nome, cnpj, telefone, email, endereco, ativo) VALUES (?, ?, ?, ?, ?, 1)';

    const [result] = await db.query(sql, [
      nome.trim(),
      cnpj || null,
      telefone || null,
      email || null,
      endereco || null
    ]);

    if (isHTMX(req)) {
      const [rows] = await db.query('SELECT * FROM empresas WHERE id = ?', [result.insertId]);
      return res.render('empresas/_linha', { empresa: rows[0] });
    }

    return res.redirect('/empresas');

  } catch (err) {
    console.error('Erro ao criar empresa:', err);
    return res.status(500).send('Erro ao criar empresa.');
  }
};

// Formulário de edição
exports.formEditar = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query('SELECT * FROM empresas WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Empresa não encontrada.');
    }

    const viewData = {
      acao: 'editar',
      isNovo: false,
      empresa: rows[0],
      isModal: isPartial(req)
    };

    if (viewData.isModal) {
      return res.render('empresas/_form', viewData);
    }

    return res.render('layout', {
      title: 'Editar Empresa',
      page: 'empresas/form',
      menuAtivo: 'cadastros',
      ...viewData
    });

  } catch (err) {
    console.error('Erro ao carregar empresa:', err);
    return res.status(500).send('Erro ao carregar empresa.');
  }
};

// Atualizar empresa
exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cnpj, telefone, email, endereco, ativo } = req.body;

    if (!nome || String(nome).trim() === '') {
      return res.status(400).send('Nome é obrigatório.');
    }

    const ativoBool = ativo === 'on' ? 1 : 0;

    const sql =
      'UPDATE empresas SET nome = ?, cnpj = ?, telefone = ?, email = ?, endereco = ?, ativo = ? WHERE id = ?';

    await db.query(sql, [
      nome.trim(),
      cnpj || null,
      telefone || null,
      email || null,
      endereco || null,
      ativoBool,
      id
    ]);

    if (isHTMX(req)) {
      const [rows] = await db.query('SELECT * FROM empresas WHERE id = ?', [id]);
      return res.render('empresas/_linha', { empresa: rows[0] });
    }

    return res.redirect('/empresas');

  } catch (err) {
    console.error('Erro ao atualizar empresa:', err);
    return res.status(500).send('Erro ao atualizar empresa.');
  }
};

// Toggle ativo
exports.toggleAtivo = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE empresas SET ativo = IF(ativo = 1, 0, 1) WHERE id = ?',
      [id]
    );

    if (isHTMX(req)) {
      const [rows] = await db.query('SELECT * FROM empresas WHERE id = ?', [id]);
      return res.render('empresas/_linha', { empresa: rows[0] });
    }

    return res.redirect('/empresas');

  } catch (err) {
    console.error('Erro ao alterar status da empresa:', err);
    return res.status(500).send('Erro ao alterar status da empresa.');
  }
};
