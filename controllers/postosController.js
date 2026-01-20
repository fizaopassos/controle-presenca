/*const db = require('../config/db');


exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*
      FROM postos p
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

// Mostrar formulário de novo posto (sem condomínios)
exports.formNovo = async (req, res) => {
  try {
    res.render('postos/form', {
      usuario: req.session.user,
      posto: null,
      acao: 'novo'
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};


// Criar novo posto (sem vincular condomínios)
exports.criar = async (req, res) => {
  const { nome, descricao } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).send('Nome é obrigatório.');
  }

  try {
    const nomeTrim = nome.trim();

    // Verifica se já existe posto com este nome (global)
    const [existing] = await db.query(
      'SELECT id, nome FROM postos WHERE nome = ?',
      [nomeTrim]
    );

    if (existing.length > 0) {
      return res.status(400).send(
        `Já existe um posto chamado "${nomeTrim}". ` +
        `<a href="/postos/${existing[0].id}/editar">Clique aqui para editá-lo</a> ` +
        `ou <a href="/postos">voltar para a lista</a>.`
      );
    }

    // Insere o posto
    await db.query(
      'INSERT INTO postos (nome, descricao, ativo) VALUES (?, ?, TRUE)',
      [nomeTrim, descricao || null]
    );

    res.redirect('/postos');
    
  } catch (error) {
    console.error('Erro ao criar posto:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).send(
        `Já existe um posto com o nome "${nome}". ` +
        `Por favor, escolha outro nome ou edite o posto existente.`
      );
    }
    
    res.status(500).send('Erro ao criar posto');
  }
};


// Mostrar formulário de edição (sem condomínios)
exports.formEditar = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM postos WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).send('Posto não encontrado');
    }

    res.render('postos/form', {
      usuario: req.session.user,
      posto: rows[0],
      acao: 'editar'
    });
  } catch (error) {
    console.error('Erro ao carregar posto:', error);
    res.status(500).send('Erro ao carregar posto');
  }
};



// Atualizar posto (sem vincular condomínios)
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, ativo } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).send('Nome é obrigatório.');
  }

  const ativoBool = ativo === 'on' ? 1 : 0;

  try {
    const nomeTrim = nome.trim();

    // Verifica se já existe outro posto com este nome
    const [existing] = await db.query(
      'SELECT id FROM postos WHERE nome = ? AND id != ?',
      [nomeTrim, id]
    );

    if (existing.length > 0) {
      return res.status(400).send(
        `Já existe outro posto chamado "${nomeTrim}". ` +
        `<a href="/postos">Voltar para a lista</a>`
      );
    }

    // Atualiza o posto
    await db.query(
      'UPDATE postos SET nome = ?, descricao = ?, ativo = ? WHERE id = ?',
      [nomeTrim, descricao || null, ativoBool, id]
    );

    res.redirect('/postos');
    
  } catch (error) {
    console.error('Erro ao atualizar posto:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).send(
        `Já existe outro posto com o nome "${nome}".`
      );
    }
    
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
};*/

const db = require('../config/db');

function isHTMX(req) {
  return req.get('HX-Request') === 'true';
}

exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*
      FROM postos p
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
    if (req.query.partial === '1' || isHTMX(req)) {
      return res.render('postos/_form', {
        posto: null,
        acao: 'novo'
      });
    }

    res.render('postos/form', {
      usuario: req.session.user,
      posto: null,
      acao: 'novo'
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};

// Criar novo posto
exports.criar = async (req, res) => {
  const { nome, descricao } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).send('Nome é obrigatório.');
  }

  try {
    const nomeTrim = nome.trim();

    // Verifica se já existe posto com este nome
    const [existing] = await db.query(
      'SELECT id, nome FROM postos WHERE nome = ?',
      [nomeTrim]
    );

    if (existing.length > 0) {
      return res.status(400).send(
        `Já existe um posto chamado "${nomeTrim}".`
      );
    }

    // Insere o posto
    const [result] = await db.query(
      'INSERT INTO postos (nome, descricao, ativo) VALUES (?, ?, TRUE)',
      [nomeTrim, descricao || null]
    );

    if (isHTMX(req)) {
      const insertedId = result.insertId;
      const [rows] = await db.query('SELECT * FROM postos WHERE id = ?', [insertedId]);
      return res.render('postos/_linha', { p: rows[0] });
    }

    res.redirect('/postos');
    
  } catch (error) {
    console.error('Erro ao criar posto:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).send(
        `Já existe um posto com o nome "${nome}".`
      );
    }
    
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

    if (req.query.partial === '1' || isHTMX(req)) {
      return res.render('postos/_form', {
        posto: rows[0],
        acao: 'editar'
      });
    }

    res.render('postos/form', {
      usuario: req.session.user,
      posto: rows[0],
      acao: 'editar'
    });
  } catch (error) {
    console.error('Erro ao carregar posto:', error);
    res.status(500).send('Erro ao carregar posto');
  }
};

// Atualizar posto
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, ativo } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).send('Nome é obrigatório.');
  }

  const ativoBool = ativo === 'on' ? 1 : 0;

  try {
    const nomeTrim = nome.trim();

    // Verifica se já existe outro posto com este nome
    const [existing] = await db.query(
      'SELECT id FROM postos WHERE nome = ? AND id != ?',
      [nomeTrim, id]
    );

    if (existing.length > 0) {
      return res.status(400).send(
        `Já existe outro posto chamado "${nomeTrim}".`
      );
    }

    // Atualiza o posto
    await db.query(
      'UPDATE postos SET nome = ?, descricao = ?, ativo = ? WHERE id = ?',
      [nomeTrim, descricao || null, ativoBool, id]
    );

    if (isHTMX(req)) {
      const [rows] = await db.query('SELECT * FROM postos WHERE id = ?', [id]);
      return res.render('postos/_linha', { p: rows[0] });
    }

    res.redirect('/postos');
    
  } catch (error) {
    console.error('Erro ao atualizar posto:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).send(
        `Já existe outro posto com o nome "${nome}".`
      );
    }
    
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

