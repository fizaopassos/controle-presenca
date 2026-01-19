const db = require('../config/db');

// Listar todos os colaboradores com empresa, posto e condomínio
exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.*,
        e.nome AS empresa_nome,
        p.nome AS posto_nome,
        cond.nome AS condominio_nome
      FROM colaboradores c
      LEFT JOIN empresas e ON c.empresa_id = e.id
      LEFT JOIN postos p ON c.posto_id = p.id
      LEFT JOIN condominios cond ON c.condominio_id = cond.id
      ORDER BY c.nome
    `);

    res.render('colaboradores/lista', {
      usuario: req.session.user,
      colaboradores: rows
    });
  } catch (error) {
    console.error('Erro ao listar colaboradores:', error);
    res.status(500).send('Erro ao listar colaboradores');
  }
};

// Mostrar formulário de novo colaborador
exports.formNovo = async (req, res) => {
  try {
    const [empresas] = await db.query('SELECT id, nome FROM empresas WHERE ativo = TRUE ORDER BY nome');
    const [postos] = await db.query('SELECT id, nome FROM postos WHERE ativo = TRUE ORDER BY nome');
    const [condominios] = await db.query('SELECT id, nome FROM condominios WHERE ativo = TRUE ORDER BY nome');

    res.render('colaboradores/form', {
      usuario: req.session.user,
      colaborador: null,
      acao: 'novo',
      empresas,
      postos,
      condominios
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};

// Criar novo colaborador
exports.criar = async (req, res) => {
  const { nome, cpf, telefone, email, empresa_id, condominio_id, posto_id, cargo, foto_url } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).send('Nome é obrigatório.');
  }

  if (!empresa_id) {
    return res.status(400).send('Empresa é obrigatória.');
  }

  try {
    await db.query(
      'INSERT INTO colaboradores (nome, cpf, telefone, email, empresa_id, condominio_id, posto_id, cargo, foto_url, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)',
      [
        nome, 
        cpf || null, 
        telefone || null, 
        email || null, 
        empresa_id,
        condominio_id || null,
        posto_id || null, 
        cargo || null, 
        foto_url || null
      ]
    );

    res.redirect('/colaboradores');
  } catch (error) {
    console.error('Erro ao criar colaborador:', error);
    
    // Verifica se é erro de CPF duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).send('CPF já cadastrado.');
    }
    
    res.status(500).send('Erro ao criar colaborador');
  }
};

// Mostrar formulário de edição
exports.formEditar = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM colaboradores WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).send('Colaborador não encontrado');
    }

    const [empresas] = await db.query('SELECT id, nome FROM empresas WHERE ativo = TRUE ORDER BY nome');
    const [postos] = await db.query('SELECT id, nome FROM postos WHERE ativo = TRUE ORDER BY nome');
    const [condominios] = await db.query('SELECT id, nome FROM condominios WHERE ativo = TRUE ORDER BY nome');

    res.render('colaboradores/form', {
      usuario: req.session.user,
      colaborador: rows[0],
      acao: 'editar',
      empresas,
      postos,
      condominios
    });
  } catch (error) {
    console.error('Erro ao carregar colaborador:', error);
    res.status(500).send('Erro ao carregar colaborador');
  }
};

// Atualizar colaborador
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome, cpf, telefone, email, empresa_id, condominio_id, posto_id, cargo, foto_url, ativo } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).send('Nome é obrigatório.');
  }

  if (!empresa_id) {
    return res.status(400).send('Empresa é obrigatória.');
  }

  const ativoBool = ativo === 'on' ? 1 : 0;

  try {
    await db.query(
      'UPDATE colaboradores SET nome = ?, cpf = ?, telefone = ?, email = ?, empresa_id = ?, condominio_id = ?, posto_id = ?, cargo = ?, foto_url = ?, ativo = ? WHERE id = ?',
      [
        nome, 
        cpf || null, 
        telefone || null, 
        email || null, 
        empresa_id,
        condominio_id || null,
        posto_id || null, 
        cargo || null, 
        foto_url || null, 
        ativoBool, 
        id
      ]
    );

    res.redirect('/colaboradores');
  } catch (error) {
    console.error('Erro ao atualizar colaborador:', error);
    
    // Verifica se é erro de CPF duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).send('CPF já cadastrado.');
    }
    
    res.status(500).send('Erro ao atualizar colaborador');
  }
};

// Ativar / Inativar colaborador (toggle)
exports.toggleAtivo = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT ativo FROM colaboradores WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).send('Colaborador não encontrado');
    }

    const ativoAtual = rows[0].ativo;
    const novoAtivo = !ativoAtual;

    await db.query('UPDATE colaboradores SET ativo = ? WHERE id = ?', [novoAtivo, id]);

    res.redirect('/colaboradores');
  } catch (error) {
    console.error('Erro ao alterar status do colaborador:', error);
    res.status(500).send('Erro ao alterar status do colaborador');
  }
};
