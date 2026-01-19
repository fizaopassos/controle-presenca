const db = require('../config/db');

/*// Listar todos os postos com condomínios vinculados
exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        GROUP_CONCAT(DISTINCT c.nome ORDER BY c.nome SEPARATOR ', ') AS condominios_nomes
      FROM postos p
      LEFT JOIN condominio_postos cp ON cp.posto_id = p.id
      LEFT JOIN condominios c ON cp.condominio_id = c.id
      GROUP BY p.id
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
};*/

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


/*// Mostrar formulário de novo posto
exports.formNovo = async (req, res) => {
  try {
    const [condominios] = await db.query('SELECT id, nome FROM condominios WHERE ativo = TRUE ORDER BY nome');

    res.render('postos/form', {
      usuario: req.session.user,
      posto: null,
      acao: 'novo',
      condominios,
      condominiosVinculados: []
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};*/

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

/*// Criar novo posto (global, sem empresa)
exports.criar = async (req, res) => {
  const { nome, descricao, condominio_ids } = req.body;

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

    // Insere o posto (sem empresa_id)
    const [result] = await db.query(
      'INSERT INTO postos (nome, descricao, ativo) VALUES (?, ?, TRUE)',
      [nomeTrim, descricao || null]
    );

    const postoId = result.insertId;

    // Vincula aos condomínios selecionados
    if (condominio_ids && condominio_ids.length > 0) {
      const ids = Array.isArray(condominio_ids) ? condominio_ids : [condominio_ids];

      for (const condId of ids) {
        if (!condId) continue;
        await db.query(
          'INSERT INTO condominio_postos (condominio_id, posto_id) VALUES (?, ?)',
          [condId, postoId]
        );
      }
    }

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
};*/

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


/*// Mostrar formulário de edição
exports.formEditar = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM postos WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).send('Posto não encontrado');
    }

    const [condominios] = await db.query('SELECT id, nome FROM condominios WHERE ativo = TRUE ORDER BY nome');
    
    // Busca condomínios já vinculados a este posto
    const [condominiosPosto] = await db.query(
      'SELECT condominio_id FROM condominio_postos WHERE posto_id = ?',
      [id]
    );

    res.render('postos/form', {
      usuario: req.session.user,
      posto: rows[0],
      acao: 'editar',
      condominios,
      condominiosVinculados: condominiosPosto.map(c => c.condominio_id)
    });
  } catch (error) {
    console.error('Erro ao carregar posto:', error);
    res.status(500).send('Erro ao carregar posto');
  }
};*/

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


/*// Atualizar posto (global, sem empresa)
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, ativo, condominio_ids } = req.body;

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

    // Atualiza o posto (sem empresa_id)
    await db.query(
      'UPDATE postos SET nome = ?, descricao = ?, ativo = ? WHERE id = ?',
      [nomeTrim, descricao || null, ativoBool, id]
    );

    // Remove todos os vínculos antigos
    await db.query('DELETE FROM condominio_postos WHERE posto_id = ?', [id]);

    // Insere os novos vínculos
    if (condominio_ids && condominio_ids.length > 0) {
      const ids = Array.isArray(condominio_ids) ? condominio_ids : [condominio_ids];

      for (const condId of ids) {
        if (!condId) continue;
        await db.query(
          'INSERT INTO condominio_postos (condominio_id, posto_id) VALUES (?, ?)',
          [condId, id]
        );
      }
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
};*/

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
};
